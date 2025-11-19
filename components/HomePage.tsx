
import React, { useEffect, useState, useMemo } from 'react';
import { getUsers } from '../services/userService';
import { getBabies } from '../services/babyService';
import { getDoctors } from '../services/doctorService';
import { getRecipes } from '../services/recipeService';
import { getArticles } from '../services/articleService';
import { getAdvices } from '../services/adviceService';
import { User, Baby, Doctor, Recipe, Article, Advice } from '../types';
import { 
    UsersIcon, BabyIcon, DoctorIcon, ThumbUpIcon, ThumbDownIcon, 
    LightBulbIcon, DocumentTextIcon, CakeIcon, TrendingUpIcon, 
    StarIcon, HeartIcon, LoadingSpinnerIcon 
} from './icons';

interface HomePageProps {
  token: string;
}

// --- Components ---

const StatCard: React.FC<{ 
    title: string; 
    count: number; 
    icon: React.ElementType; 
    colorName: string; // e.g., 'blue', 'purple'
}> = ({ title, count, icon: Icon, colorName }) => {
    const colorMap: Record<string, { bg: string, text: string, iconBg: string }> = {
        blue: { bg: 'bg-blue-500', text: 'text-blue-600', iconBg: 'bg-blue-50' },
        purple: { bg: 'bg-purple-500', text: 'text-purple-600', iconBg: 'bg-purple-50' },
        cyan: { bg: 'bg-cyan-500', text: 'text-cyan-600', iconBg: 'bg-cyan-50' },
        green: { bg: 'bg-green-500', text: 'text-green-600', iconBg: 'bg-green-50' },
        yellow: { bg: 'bg-yellow-500', text: 'text-yellow-600', iconBg: 'bg-yellow-50' },
        indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600', iconBg: 'bg-indigo-50' },
    };

    const colors = colorMap[colorName] || colorMap.blue;

    return (
        <div className="relative overflow-hidden rounded-2xl p-6 shadow-sm border border-border-color bg-white group hover:shadow-md transition-all duration-300">
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 transition-transform group-hover:scale-125 ${colors.bg}`}></div>
            <div className="flex items-center justify-between relative z-10">
                <div>
                    <p className="text-sm font-medium text-text-secondary">{title}</p>
                    <h3 className="mt-1 text-3xl font-extrabold text-text-primary">{count}</h3>
                </div>
                <div className={`p-3 rounded-xl ${colors.iconBg}`}>
                    <Icon className={`h-7 w-7 ${colors.text}`} />
                </div>
            </div>
        </div>
    );
};

const FilterButton: React.FC<{
    active: boolean;
    label: string;
    icon?: React.ElementType;
    onClick: () => void;
    colorClass?: string;
}> = ({ active, label, icon: Icon, onClick, colorClass = 'text-premier' }) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
            ${active 
                ? 'bg-premier text-white shadow-md transform scale-105' 
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200 hover:text-text-primary'}
        `}
    >
        {Icon && <Icon className={`h-4 w-4 ${active ? 'text-white' : colorClass}`} />}
        <span>{label}</span>
    </button>
);

const LeaderboardRow: React.FC<{
    rank: number;
    image?: string;
    title: string;
    subtitle?: string;
    statValue: number | string;
    statIcon: React.ElementType;
    statLabel?: string;
    statColor?: string;
}> = ({ rank, image, title, subtitle, statValue, statIcon: StatIcon, statColor = 'text-text-primary' }) => {
    
    let rankBadge;
    if (rank === 1) rankBadge = <span className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 font-bold border border-yellow-200">🥇</span>;
    else if (rank === 2) rankBadge = <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold border border-gray-200">🥈</span>;
    else if (rank === 3) rankBadge = <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold border border-orange-200">🥉</span>;
    else rankBadge = <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-text-secondary font-semibold border border-border-color">#{rank}</span>;

    const imageUrl = Array.isArray(image) && image.length > 0 ? image[0] : (typeof image === 'string' ? image : undefined);

    return (
        <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
            <div className="flex-shrink-0">
                {rankBadge}
            </div>
            <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-gray-200 overflow-hidden border border-gray-200">
                {imageUrl ? (
                     <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400 bg-gray-100">
                        <TrendingUpIcon className="h-5 w-5 opacity-50" />
                    </div>
                )}
            </div>
            <div className="flex-grow min-w-0">
                <h4 className="text-sm font-bold text-text-primary truncate" title={title}>{title}</h4>
                {subtitle && <p className="text-xs text-text-secondary truncate">{subtitle}</p>}
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-50 border border-gray-100 ${statColor}`}>
                <StatIcon className="h-4 w-4" />
                <span className="font-bold text-sm">{statValue}</span>
            </div>
        </div>
    );
};

// --- Main Component ---

const HomePage: React.FC<HomePageProps> = ({ token }) => {
    const [loading, setLoading] = useState(true);
    
    // Data States
    const [data, setData] = useState<{
        users: User[];
        babies: Baby[];
        doctors: Doctor[];
        recipes: Recipe[];
        articles: Article[];
        advices: Advice[];
    }>({ users: [], babies: [], doctors: [], recipes: [], articles: [], advices: [] });

    // UI States
    const [activeTab, setActiveTab] = useState<'recipes' | 'articles' | 'advices' | 'doctors'>('recipes');
    const [activeFilter, setActiveFilter] = useState<'likes' | 'dislikes' | 'favorites' | 'rating'>('likes');

    // Fetch All Data
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [users, babies, doctors, recipes, articles, advices] = await Promise.all([
                    getUsers(token),
                    getBabies(token),
                    getDoctors(token),
                    getRecipes(token),
                    getArticles(token),
                    getAdvices(token)
                ]);
                setData({ users, babies, doctors, recipes, articles, advices });
            } catch (error) {
                console.error("Error loading dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [token]);

    // Calculate Favorites (Bookmarks) Map
    const favoritesMap = useMemo(() => {
        const map: Record<string, number> = {};
        data.users.forEach(user => {
            // Count Recipes
            if (user.recipes && Array.isArray(user.recipes)) {
                user.recipes.forEach((r: any) => {
                    const id = typeof r === 'string' ? r : r._id;
                    if(id) map[id] = (map[id] || 0) + 1;
                });
            }
            // Count Articles
            if (user.articles && Array.isArray(user.articles)) {
                user.articles.forEach((a: any) => {
                     const id = typeof a === 'string' ? a : a._id;
                     if(id) map[id] = (map[id] || 0) + 1;
                });
            }
            // Count Doctors
            if (user.doctors && Array.isArray(user.doctors)) {
                user.doctors.forEach((d: any) => {
                     const id = typeof d === 'string' ? d : d._id;
                     if(id) map[id] = (map[id] || 0) + 1;
                });
            }
        });
        return map;
    }, [data.users]);

    // Sort and Limit Data for Leaderboard
    const leaderboardData = useMemo(() => {
        let items: any[] = [];
        let sortFn: (a: any, b: any) => number = () => 0;

        if (activeTab === 'recipes') items = [...data.recipes];
        else if (activeTab === 'articles') items = [...data.articles];
        else if (activeTab === 'advices') items = [...data.advices];
        else if (activeTab === 'doctors') items = [...data.doctors];

        if (activeFilter === 'likes') {
            sortFn = (a, b) => (b.likes?.length || 0) - (a.likes?.length || 0);
        } else if (activeFilter === 'dislikes') {
            sortFn = (a, b) => (b.dislikes?.length || 0) - (a.dislikes?.length || 0);
        } else if (activeFilter === 'favorites') {
            sortFn = (a, b) => (favoritesMap[b._id] || 0) - (favoritesMap[a._id] || 0);
        } else if (activeFilter === 'rating') {
            sortFn = (a, b) => (b.rating || 0) - (a.rating || 0);
        }

        return items.sort(sortFn).slice(0, 5);
    }, [data, activeTab, activeFilter, favoritesMap]);


    // Reset filter when tab changes if the filter isn't applicable
    useEffect(() => {
        if (activeTab === 'doctors') {
            // Doctors support 'rating' and 'favorites'
            if (activeFilter === 'likes' || activeFilter === 'dislikes') {
                setActiveFilter('rating');
            }
        } else if (activeTab === 'advices') {
             // Advices support 'likes' and 'dislikes' (favorites not tracked on user object)
             if (activeFilter === 'rating' || activeFilter === 'favorites') {
                setActiveFilter('likes');
            }
        } else {
            // Recipes/Articles support 'likes', 'dislikes', 'favorites'
            if (activeFilter === 'rating') {
                setActiveFilter('likes');
            }
        }
    }, [activeTab]);

    if (loading) {
        return <div className="flex h-full items-center justify-center"><LoadingSpinnerIcon className="h-12 w-12 text-premier" /></div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            
            {/* 1. Header */}
            <div>
                <h1 className="text-3xl font-bold text-text-primary">Tableau de bord</h1>
                <p className="text-text-secondary mt-1">Vue d'ensemble des statistiques et performances.</p>
            </div>

            {/* 2. Global Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard title="Utilisateurs" count={data.users.length} icon={UsersIcon} colorName="blue" />
                <StatCard title="Bébés" count={data.babies.length} icon={BabyIcon} colorName="purple" />
                <StatCard title="Médecins" count={data.doctors.length} icon={DoctorIcon} colorName="cyan" />
                <StatCard title="Recettes" count={data.recipes.length} icon={CakeIcon} colorName="green" />
                <StatCard title="Articles" count={data.articles.length} icon={DocumentTextIcon} colorName="yellow" />
                <StatCard title="Conseils" count={data.advices.length} icon={LightBulbIcon} colorName="indigo" />
            </div>

            {/* 3. Advanced Leaderboard Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-border-color overflow-hidden">
                <div className="p-6 border-b border-border-color">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <TrendingUpIcon className="h-6 w-6 text-premier" />
                                Classements & Tendances
                            </h2>
                            <p className="text-sm text-text-secondary mt-1">Analysez les contenus les plus performants.</p>
                        </div>
                        
                        {/* Tabs */}
                        <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
                            {[
                                { id: 'recipes', label: 'Recettes' },
                                { id: 'articles', label: 'Articles' },
                                { id: 'advices', label: 'Conseils' },
                                { id: 'doctors', label: 'Médecins' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                                        activeTab === tab.id 
                                        ? 'bg-white text-premier shadow-sm' 
                                        : 'text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3 mt-6">
                        {/* Likes / Dislikes : Not for Doctors */}
                        {activeTab !== 'doctors' && (
                            <>
                                <FilterButton 
                                    active={activeFilter === 'likes'} 
                                    label="Les plus aimés" 
                                    icon={ThumbUpIcon} 
                                    onClick={() => setActiveFilter('likes')}
                                    colorClass="text-green-600"
                                />
                                <FilterButton 
                                    active={activeFilter === 'dislikes'} 
                                    label="Les moins aimés" 
                                    icon={ThumbDownIcon} 
                                    onClick={() => setActiveFilter('dislikes')}
                                    colorClass="text-red-500"
                                />
                            </>
                        )}

                        {/* Rating : Only for Doctors */}
                        {activeTab === 'doctors' && (
                            <FilterButton 
                                active={activeFilter === 'rating'} 
                                label="Mieux notés" 
                                icon={StarIcon} 
                                onClick={() => setActiveFilter('rating')}
                                colorClass="text-yellow-500"
                            />
                        )}

                        {/* Favorites : Not for Advices */}
                        {activeTab !== 'advices' && (
                            <FilterButton 
                                active={activeFilter === 'favorites'} 
                                label="Les plus favoris" 
                                icon={HeartIcon} 
                                onClick={() => setActiveFilter('favorites')}
                                colorClass="text-rose-500"
                            />
                        )}
                    </div>
                </div>

                {/* List */}
                <div className="p-4 grid grid-cols-1 gap-2">
                    {leaderboardData.length > 0 ? (
                        leaderboardData.map((item: any, index: number) => {
                            let image = '';
                            let title = '';
                            let subtitle = '';
                            let statValue: number | string = 0;
                            let statIcon = TrendingUpIcon;
                            let statColor = 'text-text-secondary';

                            // Content Extraction
                            if (activeTab === 'recipes') {
                                const r = item as Recipe;
                                image = r.imageUrl; // Recipe imageUrl is string
                                title = r.title;
                                subtitle = r.category && (typeof r.category === 'object' ? r.category.name : 'Catégorie');
                            } else if (activeTab === 'articles') {
                                const a = item as Article;
                                image = Array.isArray(a.imageUrl) ? a.imageUrl[0] : (a.imageUrl as any);
                                title = a.title;
                                subtitle = a.category && (typeof a.category === 'object' ? a.category.name : 'Catégorie');
                            } else if (activeTab === 'advices') {
                                const ad = item as Advice;
                                image = Array.isArray(ad.imageUrl) ? ad.imageUrl[0] : (ad.imageUrl as any);
                                title = ad.title;
                                subtitle = 'Conseil';
                            } else if (activeTab === 'doctors') {
                                const d = item as Doctor;
                                image = d.imageUrl || '';
                                title = d.name;
                                subtitle = d.specialty;
                            }

                            // Stats Extraction based on Active Filter
                            if (activeFilter === 'likes') {
                                statValue = item.likes?.length || 0;
                                statIcon = ThumbUpIcon;
                                statColor = 'text-green-600 bg-green-50 border-green-100';
                            } else if (activeFilter === 'dislikes') {
                                statValue = item.dislikes?.length || 0;
                                statIcon = ThumbDownIcon;
                                statColor = 'text-red-600 bg-red-50 border-red-100';
                            } else if (activeFilter === 'favorites') {
                                statValue = favoritesMap[item._id] || 0;
                                statIcon = HeartIcon;
                                statColor = 'text-rose-600 bg-rose-50 border-rose-100';
                            } else if (activeFilter === 'rating') {
                                statValue = item.rating || 0;
                                statIcon = StarIcon;
                                statColor = 'text-yellow-600 bg-yellow-50 border-yellow-100';
                                if (activeTab === 'doctors') {
                                     statColor = 'text-cyan-600 bg-cyan-50 border-cyan-100';
                                }
                            }

                            return (
                                <LeaderboardRow
                                    key={item._id}
                                    rank={index + 1}
                                    image={image}
                                    title={title}
                                    subtitle={subtitle}
                                    statValue={statValue}
                                    statIcon={statIcon}
                                    statColor={statColor}
                                />
                            );
                        })
                    ) : (
                        <div className="py-12 text-center">
                            <p className="text-text-secondary">Aucune donnée disponible pour ce classement.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;
