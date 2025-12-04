
import React, { useEffect, useState, useMemo } from 'react';
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from '../services/doctorService';
import { Doctor } from '../types';
import Pagination from './Pagination';
import PageLayout from './PageLayout';
import { SearchIcon, LoadingSpinnerIcon, XIcon, PlusIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';
import EditDoctorModal from './EditDoctorModal';
import DoctorTable from './DoctorTable';
import Dropdown, { DropdownOption } from './Dropdown';

interface DoctorsPageProps {
  token: string;
  onLogout: () => void;
}

const ITEMS_PER_PAGE = 10;

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void; }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const baseClasses = "fixed top-5 right-5 z-50 p-4 rounded-md shadow-lg text-white flex items-center animate-fade-in-up";
  const typeClasses = type === 'success' ? 'bg-green-500' : 'bg-red-600';

  return (
    <div className={`${baseClasses} ${typeClasses}`} role="alert">
      <span className="flex-grow">{message}</span>
      <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-white/20">
        <XIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

const DoctorsPage: React.FC<DoctorsPageProps> = ({ token, onLogout }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [doctorToEdit, setDoctorToEdit] = useState<Doctor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [sortOption, setSortOption] = useState('name-asc');
  const [cityFilter, setCityFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };
  
  const sortOptions: DropdownOption[] = [
    { value: 'name-asc', label: 'Nom (A-Z)' },
    { value: 'name-desc', label: 'Nom (Z-A)' },
    { value: 'rating-desc', label: 'Mieux notés' },
    { value: 'rating-asc', label: 'Moins bien notés' },
    { value: 'city-asc', label: 'Ville (A-Z)' },
  ];
  
  const cityFilterOptions = useMemo(() => {
    // Fix: Use a type guard to ensure TypeScript correctly infers the array type as string[].
    // FIX: Explicitly type the Set as Set<string> to ensure correct type inference, preventing 'city' from being 'unknown'.
    const cities = new Set<string>(doctors.map(d => d.city).filter((c): c is string => !!c));
    const options: DropdownOption[] = [{ value: 'all', label: 'Toutes les villes' }];
    // FIX: Replaced Array.from with spread syntax to ensure proper type inference.
    [...cities].sort().forEach(city => options.push({ value: city, label: city }));
    return options;
  }, [doctors]);

  const specialtyFilterOptions = useMemo(() => {
    // Fix: Use a type guard to ensure TypeScript correctly infers the array type as string[].
    // FIX: Explicitly type the Set as Set<string> to ensure correct type inference, preventing 'specialty' from being 'unknown'.
    const specialties = new Set<string>(doctors.map(d => d.specialty).filter((s): s is string => !!s));
    const options: DropdownOption[] = [{ value: 'all', label: 'Toutes les spécialités' }];
    // FIX: Replaced Array.from with spread syntax to ensure proper type inference.
    [...specialties].sort().forEach(specialty => options.push({ value: specialty, label: specialty }));
    return options;
  }, [doctors]);

  const uniqueSpecialties = useMemo(() => {
    // FIX: Use a type guard to ensure we get an array of strings, and use spread syntax for consistency.
    const specialties = new Set(doctors.map(d => d.specialty).filter((s): s is string => !!s));
    return [...specialties].sort();
  }, [doctors]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedDoctors = await getDoctors(token);
        setDoctors(fetchedDoctors);
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === "Session expirée. Veuillez vous reconnecter.") {
            onLogout();
          } else {
            setError(err.message);
          }
        } else {
          setError("Une erreur inconnue est survenue.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, onLogout]);

  const sortedAndFilteredDoctors = useMemo(() => {
    let filtered = doctors
      .filter(doctor =>
        (doctor.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (doctor.specialty?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (doctor.city?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
      .filter(doctor => cityFilter === 'all' || doctor.city === cityFilter)
      .filter(doctor => specialtyFilter === 'all' || doctor.specialty === specialtyFilter);

    if (sortOption) {
        const [key, direction] = sortOption.split('-') as [keyof Doctor, 'asc' | 'desc'];
        filtered.sort((a: Doctor, b: Doctor) => {
            const aVal = a[key];
            const bVal = b[key];
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            let comparison = 0;
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                comparison = aVal.localeCompare(bVal, 'fr', { sensitivity: 'base' });
            } else if (typeof aVal === 'number' && typeof bVal === 'number') {
                comparison = aVal - bVal;
            }
            return direction === 'desc' ? -comparison : comparison;
        });
    }

    return filtered;
  }, [doctors, searchTerm, sortOption, cityFilter, specialtyFilter]);

  const paginatedDoctors = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredDoctors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedAndFilteredDoctors, currentPage]);

  const handleSaveDoctor = async (doctorData: Partial<Doctor>) => {
    setIsSubmitting(true);
    try {
      if (doctorToEdit) {
        const updated = await updateDoctor(token, doctorToEdit._id, doctorData);
        setDoctors(doctors.map(d => (d._id === updated._id ? { ...d, ...updated } : d)));
        showToast('Docteur mis à jour avec succès.', 'success');
      } else {
        const newDoctor = await createDoctor(token, doctorData);
        setDoctors([newDoctor, ...doctors]);
        showToast('Docteur ajouté avec succès.', 'success');
      }
      setIsModalOpen(false);
      setDoctorToEdit(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "La sauvegarde a échoué.";
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!doctorToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteDoctor(token, doctorToDelete._id);
      setDoctors(doctors.filter(d => d._id !== doctorToDelete._id));
      showToast("Docteur supprimé avec succès.", 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "La suppression a échoué.";
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
      setDoctorToDelete(null);
    }
  };
  
  const openAddModal = () => {
    setDoctorToEdit(null);
    setIsModalOpen(true);
  };
  
  const openEditModal = (doctor: Doctor) => {
    setDoctorToEdit(doctor);
    setIsModalOpen(true);
  };

  const renderContent = () => {
    if (loading) return <div className="flex-1 flex justify-center items-center"><LoadingSpinnerIcon className="h-12 w-12 text-premier" /></div>;
    if (error) return <p className="text-red-500 text-center p-4 bg-red-50 rounded-lg m-4">{error}</p>;

    return (
        <>
            <DoctorTable
              doctors={paginatedDoctors}
              onEdit={openEditModal}
              onDelete={setDoctorToDelete}
            />
            <Pagination 
                currentPage={currentPage}
                totalItems={sortedAndFilteredDoctors.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
            />
        </>
    );
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <PageLayout
        title="Gestion des docteurs"
        headerContent={
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
            <div className="relative flex-grow w-full sm:w-auto">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="search"
                placeholder="Rechercher par nom, ville..."
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-color rounded-lg text-sm text-text-primary focus:ring-premier focus:border-premier transition"
              />
            </div>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
              <Dropdown 
                options={cityFilterOptions}
                value={cityFilter}
                onChange={(val) => { setCityFilter(val); setCurrentPage(1); }}
                labelPrefix="Ville : "
              />
              <Dropdown
                options={specialtyFilterOptions}
                value={specialtyFilter}
                onChange={(val) => { setSpecialtyFilter(val); setCurrentPage(1); }}
                labelPrefix="Spécialité : "
              />
              <Dropdown
                options={sortOptions}
                value={sortOption}
                onChange={setSortOption}
                labelPrefix="Trier par : "
              />
            </div>

            <button 
              onClick={openAddModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-premier hover:bg-premier-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-premier transition-colors"
            >
                <PlusIcon className="h-5 w-5" />
                <span>Ajouter</span>
            </button>
          </div>
        }
      >
        {renderContent()}
      </PageLayout>
      
      <EditDoctorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveDoctor}
        doctor={doctorToEdit}
        isLoading={isSubmitting}
        specialties={uniqueSpecialties}
        token={token}
      />
      
      <ConfirmationModal
        isOpen={!!doctorToDelete}
        onClose={() => setDoctorToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer le docteur"
        message={`Êtes-vous sûr de vouloir supprimer Dr. ${doctorToDelete?.name}? Cette action est irréversible.`}
        confirmButtonText="Supprimer"
        isLoading={isSubmitting}
      />
    </>
  );
};

export default DoctorsPage;
