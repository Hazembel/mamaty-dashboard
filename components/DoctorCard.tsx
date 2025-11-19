
import React from 'react';
import { Doctor } from '../types';
import { TrashIcon, PencilIcon } from './icons';

interface DoctorCardProps {
    doctor: Doctor;
    onEdit: (doctor: Doctor) => void;
    onDelete: (doctor: Doctor) => void;
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onEdit, onDelete }) => {
    const placeholderImage = 'https://via.placeholder.com/150/E5E7EB/6B7280?text=No+Image';
    
    return (
        <div className="bg-white rounded-lg shadow-default overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 flex flex-col">
            <div className="relative h-40 bg-gray-200">
                <img 
                    src={doctor.imageUrl || placeholderImage}
                    alt={`Dr. ${doctor.name}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = placeholderImage; }}
                />
            </div>
            <div className="p-5 flex-grow flex flex-col">
                <h3 className="text-lg font-bold text-text-primary truncate">{doctor.name}</h3>
                <p className="text-sm text-premier font-medium">{doctor.specialty}</p>
                <div className="mt-2 text-xs text-text-secondary flex items-center gap-1">
                    <svg className="h-3 w-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    <span>{doctor.rating.toFixed(1)}</span>
                    <span className="mx-1.5">·</span>
                    <span>{doctor.city}</span>
                </div>

                <div className="mt-auto pt-4 flex items-center justify-end space-x-2">
                  <button 
                    onClick={() => onEdit(doctor)}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-text-secondary hover:text-text-primary transition-colors"
                    aria-label={`Modifier ${doctor.name}`}
                  >
                     <PencilIcon className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => onDelete(doctor)}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-text-secondary hover:text-text-primary transition-colors"
                    aria-label={`Supprimer ${doctor.name}`}
                  >
                     <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
            </div>
        </div>
    );
};

export default DoctorCard;
