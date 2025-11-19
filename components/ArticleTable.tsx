
import React from 'react';
import { Article } from '../types';
import { TrashIcon, PencilIcon, ThumbUpIcon, ThumbDownIcon } from './icons';

interface ArticleTableProps {
  articles: Article[];
  onEdit: (article: Article) => void;
  onDelete: (article: Article) => void;
}

const ArticleTable: React.FC<ArticleTableProps> = ({ articles, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border-color">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Aperçu
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Titre
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Catégorie
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Sources
            </th>
             <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Réactions
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-border-color">
          {articles.map((article) => (
            <tr key={article._id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-12 w-12 rounded-lg bg-gray-200 overflow-hidden">
                    {article.imageUrl && article.imageUrl.length > 0 ? (
                        <img src={article.imageUrl[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">No IMG</div>
                    )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-text-primary">{article.title}</div>
                <div className="text-xs text-text-secondary truncate max-w-xs">
                    {article.description && article.description[0]}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                 {typeof article.category === 'object' && article.category ? (
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                         {article.category.name}
                     </span>
                 ) : (
                     <span className="text-gray-400 italic">N/A</span>
                 )}
              </td>
              <td className="px-6 py-4 text-sm text-text-secondary">
                {article.sources && article.sources.length > 0 ? (
                   <div className="flex flex-wrap gap-1.5">
                       {article.sources.map((source, idx) => (
                           <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                               {source.toUpperCase()}
                           </span>
                       ))}
                   </div>
                ) : (
                    <span className="text-gray-400 italic">Aucune</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-green-600">
                        <ThumbUpIcon className="h-4 w-4" />
                        <span className="font-medium">{article.likes ? article.likes.length : 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-red-500">
                        <ThumbDownIcon className="h-4 w-4" />
                        <span className="font-medium">{article.dislikes ? article.dislikes.length : 0}</span>
                    </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <button 
                    onClick={() => onEdit(article)}
                    className="p-2 rounded-md text-text-secondary hover:bg-gray-100 hover:text-premier transition-colors"
                    aria-label={`Modifier ${article.title}`}
                  >
                     <PencilIcon className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => onDelete(article)}
                    className="p-2 rounded-md text-text-secondary hover:bg-gray-100 hover:text-red-600 transition-colors"
                    aria-label={`Supprimer ${article.title}`}
                  >
                     <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ArticleTable;
