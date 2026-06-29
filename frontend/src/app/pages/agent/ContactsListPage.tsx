import React, { useState, useEffect } from 'react';
import { updateAppointment } from '../../services/api';

import { useNavigate } from 'react-router-dom';
import { 
  Phone, Mail, MapPin, Building, User, Search, 
  Filter, MoreVertical, Star, StarOff, Briefcase,
  MessageCircle, Clock, Award, TrendingUp,
  ChevronRight, Eye, Edit, Trash2, Download,
  Grid, List, X, CheckCircle, AlertCircle
} from 'lucide-react';

const contacts = [
  { id: 1, company: 'Société ABC', contact: 'Jean Dupont', role: 'Directeur Commercial', phone: '+33 6 12 34 56 78', email: 'j.dupont@societeabc.fr', city: 'Paris', industry: 'Tech', status: 'actif', lastContact: '2026-03-25', deals: 3, revenue: 125000 },
  { id: 2, company: 'Entreprise XYZ', contact: 'Marie Martin', role: 'CEO', phone: '+33 6 23 45 67 89', email: 'm.martin@xyz.fr', city: 'Lyon', industry: 'Finance', status: 'actif', lastContact: '2026-03-28', deals: 2, revenue: 89000 },
  { id: 3, company: 'Solutions Pro', contact: 'Pierre Leroy', role: 'Responsable Achats', phone: '+33 6 34 56 78 90', email: 'p.leroy@solutions-pro.fr', city: 'Marseille', industry: 'Services', status: 'inactif', lastContact: '2026-03-20', deals: 1, revenue: 45000 },
  { id: 4, company: 'Tech Innovate', contact: 'Sophie Bernard', role: 'Directrice IT', phone: '+33 6 45 67 89 01', email: 's.bernard@techinnovate.fr', city: 'Toulouse', industry: 'Tech', status: 'actif', lastContact: '2026-03-29', deals: 5, revenue: 250000 },
  { id: 5, company: 'Digital Services', contact: 'Luc Moreau', role: 'Manager', phone: '+33 6 56 78 90 12', email: 'l.moreau@digital-services.fr', city: 'Nantes', industry: 'Digital', status: 'actif', lastContact: '2026-03-27', deals: 2, revenue: 67000 },
  { id: 6, company: 'Startup Alpha', contact: 'Emma Dubois', role: 'Fondatrice', phone: '+33 6 67 89 01 23', email: 'e.dubois@startup-alpha.fr', city: 'Bordeaux', industry: 'Tech', status: 'nouveau', lastContact: '2026-03-30', deals: 0, revenue: 0 },
  { id: 7, company: 'Industries Beta', contact: 'Thomas Petit', role: 'DG', phone: '+33 6 78 90 12 34', email: 't.petit@industries-beta.fr', city: 'Lille', industry: 'Industrie', status: 'actif', lastContact: '2026-03-26', deals: 4, revenue: 180000 },
  { id: 8, company: 'Commerce Gamma', contact: 'Julie Roux', role: 'Responsable', phone: '+33 6 89 01 23 45', email: 'j.roux@commerce-gamma.fr', city: 'Strasbourg', industry: 'Commerce', status: 'inactif', lastContact: '2026-03-15', deals: 1, revenue: 32000 },
  { id: 9, company: 'Services Delta', contact: 'Marc Blanc', role: 'Directeur', phone: '+33 6 90 12 34 56', email: 'm.blanc@services-delta.fr', city: 'Nice', industry: 'Services', status: 'actif', lastContact: '2026-03-24', deals: 3, revenue: 95000 },
  { id: 10, company: 'Consulting Epsilon', contact: 'Nadia Kacem', role: 'Associée', phone: '+33 6 01 23 45 67', email: 'n.kacem@consulting-epsilon.fr', city: 'Montpellier', industry: 'Consulting', status: 'actif', lastContact: '2026-03-22', deals: 2, revenue: 78000 }
];

type Contact = typeof contacts[number];

// ── Helper: ligne info en mode lecture ────────────────────────────────────────
function InfoRow({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${highlight ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-0.5">{label}</p>
        <p className={`text-sm font-semibold truncate ${highlight ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
      </div>
    </div>
  );
}

export default function ContactsListPage() {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Contact | null>(null);
  const [contactsList, setContactsList] = useState(contacts);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const navigate = useNavigate();
  
  const [newContact, setNewContact] = useState({
  contact: '',
  phone: '',
  email: ''
});

  useEffect(() => {
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favoriteContacts');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const industries = ['all', ...new Set(contactsList.map(c => c.industry))];
  const statuses = ['all', 'actif', 'inactif', 'nouveau'];

  const filteredContacts = contactsList.filter(contact => {
    const matchesSearch =
      contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || contact.status === filterStatus;
    const matchesIndustry = filterIndustry === 'all' || contact.industry === filterIndustry;
    
    return matchesSearch && matchesStatus && matchesIndustry;
  });

  const handleOpenModal = (contact: Contact) => {
    setSelectedContact(contact);
    setEditData({ ...contact });
    setEditMode(false);
    setShowDetailsModal(true);
  };

 const handleSaveEdit = () => {
  console.log("SAVE CLICKED", editData);

  if (!editData) return;

  setContactsList(prev =>
    prev.map(c =>
      c.id === editData.id ? editData : c
    )
  );

  setSelectedContact(editData);
  setEditMode(false);

  showNotificationMessage(
    'Fiche contact mise à jour avec succès !'
  );
};

  const handleFieldChange = (field: keyof Contact, value: string | number) => {
    setEditData(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleCall = (contact: Contact) => {
    navigate('/agent/contact', { state: { contact, autoStart: true } });
  };

  const toggleFavorite = (contactId: number) => {
    let newFavorites;
    if (favorites.includes(contactId)) {
      newFavorites = favorites.filter(id => id !== contactId);
      showNotificationMessage('Retiré des favoris');
    } else {
      newFavorites = [...favorites, contactId];
      showNotificationMessage('Ajouté aux favoris');
    }
    setFavorites(newFavorites);
    localStorage.setItem('favoriteContacts', JSON.stringify(newFavorites));
  };

  const showNotificationMessage = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'actif': return 'bg-gradient-to-r from-emerald-500 to-teal-500';
      case 'inactif': return 'bg-gradient-to-r from-gray-500 to-gray-600';
      case 'nouveau': return 'bg-gradient-to-r from-blue-500 to-indigo-500';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'actif': return 'Actif';
      case 'inactif': return 'Inactif';
      case 'nouveau': return 'Nouveau';
      default: return status;
    }
  };

  const getIndustryIcon = (industry: string) => {
    switch(industry) {
      case 'Tech': return <Award className="w-4 h-4" />;
      case 'Finance': return <TrendingUp className="w-4 h-4" />;
      default: return <Briefcase className="w-4 h-4" />;
    }
  };

  const ContactCard = ({ contact }: { contact: Contact }) => (
    <div className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-[1.02]">
      <div className={`h-1 ${getStatusColor(contact.status)}`} />
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              {contact.company.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">{contact.company}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{contact.contact}</p>
            </div>
          </div>
          <button 
            onClick={() => toggleFavorite(contact.id)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
          >
            {favorites.includes(contact.id) ? 
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> : 
              <StarOff className="w-5 h-5 text-gray-400" />
            }
          </button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Briefcase className="w-4 h-4 text-blue-500" />
            {contact.role}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Building className="w-4 h-4 text-blue-500" />
            {contact.industry}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4 text-blue-500" />
            {contact.city}
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Dernier contact</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{contact.lastContact}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Affaires en cours</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">{contact.deals}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">CA généré</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">{contact.revenue.toLocaleString()} €</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleCall(contact)}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4" />
            Appeler
          </button>
          <button
            onClick={() => handleOpenModal(contact)}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const ContactRow = ({ contact }: { contact: Contact }) => (
    <tr className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 group">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            {contact.company.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{contact.company}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{contact.industry}</p>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{contact.contact}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{contact.role}</p>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Phone className="w-4 h-4 text-blue-500" />
          {contact.phone}
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Mail className="w-4 h-4" />
          {contact.email}
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <MapPin className="w-4 h-4" />
          {contact.city}
        </div>
      </td>
      <td className="p-4">
        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(contact.status)}`}>
          {getStatusText(contact.status)}
        </span>
      </td>
      <td className="p-4">
        <div className="flex gap-2">
          <button
            onClick={() => handleCall(contact)}
            className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
            title="Appeler"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleFavorite(contact.id)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              favorites.includes(contact.id) 
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title={favorites.includes(contact.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            {favorites.includes(contact.id) ? <Star className="w-4 h-4 fill-yellow-500" /> : <StarOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => handleOpenModal(contact)}
            className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            title="Voir détails"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );

  const stats = {
    total: contactsList.length,
    actifs: contacts.filter(c => c.status === 'actif').length,
    revenuTotal: contacts.reduce((sum, c) => sum + c.revenue, 0),
    affairesTotal: contacts.reduce((sum, c) => sum + c.deals, 0)
  };

  return (
  <>
  <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        .animate-pulse-slow {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Notification */}
          {showNotification && (
            <div className="fixed top-4 right-4 z-50 animate-slideIn">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 border-l-4 border-blue-500">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                  <p className="text-gray-900 dark:text-gray-100">{notificationMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Liste des Contacts
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Gérez votre réseau professionnel efficacement</p>
              </div>
              
         <div className="flex gap-2">
  <button
    onClick={() => setShowCreateModal(true)}
    
    className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium"
  >
    + Nouveau Contact
  </button>
</div>
  
</div>
              
      

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Contacts</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
                  </div>
                  <User className="w-8 h-8 text-blue-500 opacity-50" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Contacts Actifs</p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.actifs}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-emerald-500 opacity-50" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Affaires en cours</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.affairesTotal}</p>
                  </div>
                  <Briefcase className="w-8 h-8 text-purple-500 opacity-50" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">CA Généré</p>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.revenuTotal.toLocaleString()} €</p>
                  </div>
                  <Award className="w-8 h-8 text-amber-500 opacity-50" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, société, ville ou rôle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-500 font-medium shadow-sm"
                />
              </div>
              
              <div className="flex gap-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="pl-9 pr-8 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {status === 'all' ? 'Tous les statuts' : getStatusText(status)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={filterIndustry}
                    onChange={(e) => setFilterIndustry(e.target.value)}
                    className="pl-9 pr-8 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                  >
                    {industries.map(industry => (
                      <option key={industry} value={industry}>
                        {industry === 'all' ? 'Tous les secteurs' : industry}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid' ? 'bg-white dark:bg-gray-900 shadow-md text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list' ? 'bg-white dark:bg-gray-900 shadow-md text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Contacts Display */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
              {filteredContacts.map(contact => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-fadeIn">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50">
                    <tr>
                      <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">Société</th>
                      <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">Contact</th>
                      <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">Téléphone</th>
                      <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">Email</th>
                      <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">Ville</th>
                      <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">Statut</th>
                      <th className="text-left p-4 text-gray-600 dark:text-gray-400 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map(contact => (
                      <ContactRow key={contact.id} contact={contact} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredContacts.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
              <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">Aucun contact trouvé</p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterIndustry('all');
                }}
                className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
              >
                Effacer les filtres
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Détails / Édition Contact */}
      {showDetailsModal && selectedContact && editData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slideIn">
            {/* Header barre couleur */}
            <div className={`h-1.5 ${getStatusColor(editData.status)}`} />

            {/* Header titre */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {editData.company.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {editMode ? 'Modifier la fiche' : editData.company}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {editMode ? 'Tous les champs sont modifiables' : editData.contact}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all"
                  >
                    <Edit className="w-4 h-4" />
                    Modifier
                  </button>
                )}
                <button
                  onClick={() => { setShowDetailsModal(false); setEditMode(false); }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Corps */}
            <div className="p-6 overflow-y-auto max-h-[65vh]">
              {editMode ? (
                /* ── MODE ÉDITION ── */
                <div className="space-y-5">
                  {/* Société & Contact */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Société *</label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                        <input
                          type="text"
                          value={editData.company}
                          onChange={e => handleFieldChange('company', e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Nom du contact *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                        <input
                          type="text"
                          value={editData.contact}
                          onChange={e => handleFieldChange('contact', e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rôle & Secteur */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Fonction / Rôle</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                        <input
                          type="text"
                          value={editData.role}
                          onChange={e => handleFieldChange('role', e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Secteur d'activité</label>
                      <div className="relative">
                        <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                        <input
                          type="text"
                          value={editData.industry}
                          onChange={e => handleFieldChange('industry', e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* TÉLÉPHONE & EMAIL */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Téléphone *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                        <input
                          type="tel"
                          value={editData.phone}
                          readOnly
                          placeholder="+33 6 XX XX XX XX"
                          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-emerald-400/60 dark:border-emerald-600/60 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                        <input
                          type="email"
                          value={editData.email}
                          onChange={e => handleFieldChange('email', e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ville & Statut */}
                <div>
  <label className="block text-xs font-bold mb-1">
    Campagne
  </label>

  <select
    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder:text-gray-400 rounded-xl"
  >
    <option>Isolation</option>
    <option>PAC</option>
    <option>PV</option>
    <option>Toiture</option>
  </select>
</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Ville</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                        <input
                          type="text"
                          value={editData.city}
                          onChange={e => handleFieldChange('city', e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Statut</label>
                      <select
                        value={editData.status}
                        onChange={e => handleFieldChange('status', e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      >
                        <option value="actif">Actif</option>
                        <option value="inactif">Inactif</option>
                        <option value="nouveau">Nouveau</option>
                      </select>
                    </div>
                  </div>

                 <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">

  <h3 className="font-bold text-white mb-3">
    Qualification Client
  </h3>

  <div className="grid grid-cols-2 gap-3">

    <input
      placeholder="Revenus"
      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl"
    />

    <input
      placeholder="Crédits"
      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl"
    />

    <input
      placeholder="Mode Chauffage"
      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl"
    />

    <input
      placeholder="Etat Toiture"
      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl"
    />

  </div>

</div>



                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Affaires en cours</label>
                      <input
                        type="number"
                        min={0}
                        value={editData.deals}
                        onChange={e => handleFieldChange('deals', Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">CA Généré (€)</label>
                      <input
                        type="number"
                        min={0}
                        value={editData.revenue}
                        onChange={e => handleFieldChange('revenue', Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* ── MODE LECTURE ── */
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <InfoRow icon={<Briefcase className="w-4 h-4 text-blue-500" />} label="Fonction" value={editData.role} />
                      <InfoRow icon={<Building className="w-4 h-4 text-blue-500" />} label="Secteur" value={editData.industry} />
                      <InfoRow icon={<MapPin className="w-4 h-4 text-blue-500" />} label="Ville" value={editData.city} />
                    </div>
                    <div className="space-y-3">
                      <InfoRow icon={<Phone className="w-4 h-4 text-emerald-500" />} label="Téléphone" value={editData.phone} highlight />
                      <InfoRow icon={<Mail className="w-4 h-4 text-blue-500" />} label="Email" value={editData.email} />
                      <InfoRow icon={<Clock className="w-4 h-4 text-blue-500" />} label="Dernier contact" value={editData.lastContact} />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Activité commerciale</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Affaires en cours</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{editData.deals}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">CA généré</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{editData.revenue.toLocaleString()} €</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
              {editMode ? (
                <>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Enregistrer les modifications
                  </button>
                  <button
                    onClick={() => { setEditData({ ...selectedContact }); setEditMode(false); }}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                  >
                    Annuler
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleCall(editData)}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Appeler
                  </button>
                  <button className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {showCreateModal && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg">

      <h2 className="text-xl font-bold mb-4">
        Nouveau Contact
      </h2>

      <div className="space-y-3">

        
        <input
  placeholder="Nom"
  value={newContact.contact}
  onChange={(e) =>
    setNewContact({
      ...newContact,
      contact: e.target.value
    })
  }
  className="w-full p-3 rounded-xl border"
/>
<input
  placeholder="Téléphone"
  value={newContact.phone}
  onChange={(e) =>
    setNewContact({
      ...newContact,
      phone: e.target.value
    })
  }
  className="w-full p-3 rounded-xl border"
/>

       <input
  placeholder="Email"
  value={newContact.email}
  onChange={(e) =>
    setNewContact({
      ...newContact,
      email: e.target.value
    })
  }
  className="w-full p-3 rounded-xl border"
/>

      </div>

      <div className="flex justify-end gap-2 mt-4">

        <button
          onClick={() => setShowCreateModal(false)}
          className="px-4 py-2 bg-gray-200 rounded-xl"
        >
          Annuler
        </button>

        <button
  onClick={() => {

    const contact = {
  id: Date.now(),
  company: newContact.contact,
  contact: newContact.contact,
  role: "",
  phone: newContact.phone,
  email: newContact.email,
  city: "",
  industry: "",
  status: "nouveau",
  lastContact: new Date().toISOString().split("T")[0],
  deals: 0,
  revenue: 0
};

setContactsList(prev => [...prev, contact]);

setNewContact({
  contact: '',
  phone: '',
  email: ''
});

setShowCreateModal(false);

showNotificationMessage(
  "Contact ajouté avec succès !"
);

    setContactsList(prev => [...prev, contact]);

    setShowCreateModal(false);

    showNotificationMessage(
      "Contact ajouté avec succès !"
    );

  }}
  className="px-4 py-2 bg-emerald-600 text-white rounded-xl"
>
  Enregistrer
</button>
      </div>

    </div>
  </div>
)}
    </>
  );
}