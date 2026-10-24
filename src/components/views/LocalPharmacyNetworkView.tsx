import React, { useState } from 'react';
import {
  Store,
  ArrowRightLeft,
  Share2,
  Plus,
  CheckCircle2,
  Clock,
  Truck,
  Phone,
  Building,
  Sparkles,
  Search,
  Tag,
  AlertCircle,
  FileCheck2,
  Users,
} from 'lucide-react';
import { useMediGuard } from '../../context/MediGuardContext';
import { formatPaiseINR } from '../../engines/reorder';
import { SharedMedicineListing } from '../../schemas';

export const LocalPharmacyNetworkView: React.FC = () => {
  const {
    currentUser,
    users,
    loginAsLocalStore,
    sharedListings,
    postSharedListing,
    requestSharedListing,
    updateSharedListingStatus,
    medicines,
    rules,
  } = useMediGuard();

  const [activeTab, setActiveTab] = useState<'exchange' | 'my_listings' | 'post'>('exchange');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'AVAILABLE' | 'REQUESTED' | 'IN_TRANSIT'>('ALL');

  // Request stock modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedListingForRequest, setSelectedListingForRequest] = useState<SharedMedicineListing | null>(null);
  const [requestQty, setRequestQty] = useState<number>(10);
  const [requestNotes, setRequestNotes] = useState('');

  // Post surplus modal / form state
  const [postMedSku, setPostMedSku] = useState(medicines[0]?.sku || 'MED-CTX-1G');
  const [postBatchCode, setPostBatchCode] = useState('CTX-2026-RET');
  const [postExpiryDate, setPostExpiryDate] = useState('2026-12-10');
  const [postUnits, setPostUnits] = useState(25);
  const [postDiscount, setPostDiscount] = useState(30);
  const [postNotes, setPostNotes] = useState('Surplus retail inventory. Looking to share with neighboring chemist.');
  const [postSuccess, setPostSuccess] = useState(false);

  // Filter local store owners
  const localStores = users.filter((u) => u.facilityType === 'LOCAL_PHARMACY');

  // Filter listings
  const filteredListings = sharedListings.filter((l) => {
    const matchesSearch =
      l.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.ownerStoreName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.batchCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'ALL' || l.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const myListings = sharedListings.filter((l) => l.ownerStoreId === currentUser.id);

  const handleOpenRequest = (listing: SharedMedicineListing) => {
    setSelectedListingForRequest(listing);
    setRequestQty(Math.min(10, listing.availableUnits));
    setRequestNotes(`Urgent customer prescription demand at ${currentUser.facilityName || currentUser.name}.`);
    setIsRequestModalOpen(true);
  };

  const handleConfirmRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListingForRequest) return;
    requestSharedListing(selectedListingForRequest.id, requestQty, requestNotes);
    setIsRequestModalOpen(false);
  };

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    const med = medicines.find((m) => m.sku === postMedSku) || medicines[0];

    postSharedListing({
      medicineName: med.brandName ? `${med.genericName} (${med.brandName})` : med.genericName,
      medicineSku: med.sku,
      batchCode: postBatchCode.toUpperCase().trim(),
      expiresOn: postExpiryDate,
      availableUnits: postUnits,
      unitPricePaise: med.unitCostPaise,
      discountPercent: postDiscount,
      notes: postNotes,
    });

    setPostSuccess(true);
    setTimeout(() => {
      setPostSuccess(false);
      setActiveTab('exchange');
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-12 text-[#1C1917]">
      {/* 1. View Header with Store Identity Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5E4]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF7ED] border border-[#FFEDD5] text-[#C2410C] text-xs font-semibold mb-1">
            <Share2 className="w-3.5 h-3.5" />
            <span>Local Chemist B2B Network & Medicine Exchange</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1917]">
            Inter-Store Medicine Sharing
          </h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            Local medical owners exchange near-expiry stock at discounted rates to eliminate waste and prevent patient stockouts.
          </p>
        </div>

        {/* Action Button: Exactly ONE filled primary orange button */}
        <button
          onClick={() => setActiveTab('post')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>List Surplus Medicine</span>
        </button>
      </div>

      {/* 2. Active Medical Store Owner Identity Card */}
      <div className="bg-white border border-[#E7E5E4] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-14 h-14 rounded-xl object-cover border border-[#E7E5E4]"
          />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-[#1C1917]">{currentUser.name}</span>
              <span className="px-2 py-0.5 rounded bg-[#DCFCE7] text-[#15803D] font-bold text-[10px] border border-[#BBF7D0]">
                Active Store Owner
              </span>
            </div>
            <div className="text-xs text-[#1C1917] font-semibold">
              {currentUser.facilityName || 'CarePlus Chemist & Druggist'}
            </div>
            <div className="text-[11px] text-[#78716C] flex items-center gap-3 flex-wrap">
              <span>📍 {currentUser.storeArea || 'Market Road, Sector 14, Gurugram'}</span>
              <span>&bull;</span>
              <span className="font-mono">License: {currentUser.drugLicenseNo || 'DL-20B-184920'}</span>
              <span>&bull;</span>
              <span>📞 {currentUser.phone || '+91 98220 77112'}</span>
            </div>
          </div>
        </div>

        {/* Quick Switcher among local chemist owners for testing */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-[#E7E5E4]">
          <span className="text-[11px] text-[#78716C] font-medium">Switch Store:</span>
          <select
            value={currentUser.id}
            onChange={(e) => loginAsLocalStore(e.target.value)}
            className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#1C1917] focus:ring-2 focus:ring-[#C2410C] focus:outline-none cursor-pointer"
          >
            {localStores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.facilityName?.split(' ')[0]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-[#E7E5E4]">
        <button
          onClick={() => setActiveTab('exchange')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'exchange'
              ? 'border-[#C2410C] text-[#C2410C]'
              : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Local Chemist Exchange Board</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#FAFAF9] text-[#78716C] border border-[#E7E5E4]">
            {sharedListings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('my_listings')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'my_listings'
              ? 'border-[#C2410C] text-[#C2410C]'
              : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>My Listed Medicines</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#FAFAF9] text-[#78716C] border border-[#E7E5E4]">
            {myListings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('post')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'post'
              ? 'border-[#C2410C] text-[#C2410C]'
              : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Post Surplus Medicine</span>
        </button>
      </div>

      {/* TAB 1: LOCAL CHEMIST EXCHANGE BOARD */}
      {activeTab === 'exchange' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E7E5E4]">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search medicine, batch, or chemist store..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {(['ALL', 'AVAILABLE', 'REQUESTED', 'IN_TRANSIT'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                    selectedFilter === filter
                      ? 'bg-[#1C1917] text-white'
                      : 'bg-[#FAFAF9] text-[#78716C] hover:text-[#1C1917] border border-[#E7E5E4]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Listings Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListings.map((listing) => {
              const isMyListing = listing.ownerStoreId === currentUser.id;
              const discountedPaise = Math.round(
                listing.unitPricePaise * (1 - listing.discountPercent / 100)
              );

              const med = medicines.find(
                (m) =>
                  m.sku.toLowerCase() === listing.medicineSku.toLowerCase() ||
                  (m.brandName && listing.medicineName.toLowerCase().includes(m.brandName.toLowerCase()))
              );
              const imgUrl =
                med?.image ||
                'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=80';

              return (
                <div
                  key={listing.id}
                  className={`bg-white rounded-xl border p-5 flex flex-col justify-between space-y-4 card-hover-lift transition-all shadow-2xs ${
                    isMyListing ? 'border-[#C2410C]/40 bg-[#FFF7ED]/20' : 'border-[#E7E5E4] hover:border-[#C2410C]'
                  }`}
                >
                  {/* Card Top */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={imgUrl}
                          alt={listing.medicineName}
                          className="w-12 h-12 rounded-xl object-cover border border-[#E7E5E4] shrink-0 shadow-2xs"
                        />
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono text-[#78716C] uppercase tracking-wider">
                            {listing.medicineSku}
                          </div>
                          <h3 className="font-bold text-sm text-[#1C1917] leading-snug truncate">
                            {listing.medicineName}
                          </h3>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {listing.status === 'AVAILABLE' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                          Available
                        </span>
                      )}
                      {listing.status === 'REQUESTED' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF9C3] text-[#A16207] border border-[#FEF08A]">
                          Requested
                        </span>
                      )}
                      {listing.status === 'IN_TRANSIT' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                          In Transit
                        </span>
                      )}
                      {listing.status === 'COMPLETED' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F5F5F4] text-[#78716C] border border-[#E7E5E4]">
                          Delivered
                        </span>
                      )}
                    </div>

                    {/* Pricing Strip */}
                    <div className="flex items-baseline gap-2 bg-[#FAFAF9] p-2.5 rounded-lg border border-[#E7E5E4]">
                      <div className="text-sm font-bold text-[#C2410C] font-mono">
                        {formatPaiseINR(discountedPaise)} / unit
                      </div>
                      <div className="text-xs text-[#78716C] line-through font-mono">
                        {formatPaiseINR(listing.unitPricePaise)}
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFF7ED] text-[#C2410C] font-bold ml-auto">
                        {listing.discountPercent}% OFF
                      </span>
                    </div>

                    {/* Stock Details */}
                    <div className="space-y-1 text-xs text-[#78716C]">
                      <div className="flex items-center justify-between">
                        <span>Batch Code:</span>
                        <strong className="font-mono text-[#1C1917]">{listing.batchCode}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Shelf Expiry:</span>
                        <strong className="font-mono text-[#C2410C]">{listing.expiresOn}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Available Units:</span>
                        <strong className="font-mono text-[#1C1917]">{listing.availableUnits} units</strong>
                      </div>
                    </div>

                    {/* Owner Store Info */}
                    <div className="pt-2 border-t border-[#E7E5E4] space-y-0.5 text-[11px] text-[#78716C]">
                      <div className="font-semibold text-[#1C1917]">
                        🏪 {listing.ownerStoreName}
                      </div>
                      <div className="truncate">
                        👤 {listing.ownerOwnerName} &bull; 📍 {listing.ownerCity}
                      </div>
                      {listing.notes && (
                        <div className="text-[11px] text-[#78716C] italic pt-1 line-clamp-2">
                          "{listing.notes}"
                        </div>
                      )}
                    </div>

                    {/* Active Request Details if any */}
                    {listing.requestedByStoreName && (
                      <div className="p-2 bg-[#FFF7ED] rounded border border-[#FFEDD5] text-[11px] text-[#C2410C] space-y-0.5">
                        <div className="font-bold">Claimed by: {listing.requestedByStoreName}</div>
                        <div>Quantity: {listing.requestedUnits} units</div>
                      </div>
                    )}
                  </div>

                  {/* Card Action */}
                  <div className="pt-2 border-t border-[#E7E5E4]">
                    {isMyListing ? (
                      <div className="flex items-center gap-2">
                        {listing.status === 'REQUESTED' && (
                          <button
                            onClick={() => updateSharedListingStatus(listing.id, 'IN_TRANSIT')}
                            className="flex-1 py-1.5 text-xs font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg transition-colors"
                          >
                            Dispatch Stock
                          </button>
                        )}
                        {listing.status === 'IN_TRANSIT' && (
                          <button
                            onClick={() => updateSharedListingStatus(listing.id, 'COMPLETED')}
                            className="flex-1 py-1.5 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors"
                          >
                            Mark Completed
                          </button>
                        )}
                        {listing.status === 'AVAILABLE' && (
                          <span className="text-[11px] text-[#78716C] font-mono">
                            Your active listing on network
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {listing.status === 'AVAILABLE' && (
                          <button
                            onClick={() => handleOpenRequest(listing)}
                            className="flex-1 py-2 text-xs font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <span>Request Stock</span>
                            <span>&rarr;</span>
                          </button>
                        )}
                        <a
                          href={`tel:${listing.ownerPhone}`}
                          className="px-3 py-2 text-xs font-medium text-[#78716C] hover:text-[#1C1917] bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call Chemist</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MY LISTED MEDICINES */}
      {activeTab === 'my_listings' && (
        <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#E7E5E4] bg-[#FAFAF9] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#1C1917]">
                Medicines Listed by {currentUser.facilityName || currentUser.name}
              </h3>
              <p className="text-xs text-[#78716C]">
                Track incoming claim requests from other local chemists and mark dispatch status.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('post')}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#C2410C] rounded-lg"
            >
              + List New Drug
            </button>
          </div>

          {myListings.length === 0 ? (
            <div className="p-12 text-center text-[#78716C] space-y-2">
              <Store className="w-8 h-8 text-[#78716C] mx-auto opacity-60" />
              <div className="font-bold text-sm text-[#1C1917]">No active listings posted yet</div>
              <p className="text-xs max-w-sm mx-auto">
                Have surplus stock expiring in 30-90 days? List it here so neighboring chemists can buy it before expiry.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E7E5E4]">
              {myListings.map((l) => (
                <div key={l.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1C1917]">{l.medicineName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAFAF9] border border-[#E7E5E4] text-[#78716C]">
                        {l.batchCode}
                      </span>
                    </div>
                    <div className="text-xs text-[#78716C] flex items-center gap-3">
                      <span>Units: <strong>{l.availableUnits}</strong></span>
                      <span>&bull;</span>
                      <span>Expires: <strong className="text-[#C2410C]">{l.expiresOn}</strong></span>
                      <span>&bull;</span>
                      <span>Peer Discount: <strong>{l.discountPercent}% OFF</strong></span>
                    </div>
                    {l.requestedByStoreName && (
                      <div className="text-xs text-[#C2410C] font-semibold pt-1">
                        Claimed by: {l.requestedByStoreName} ({l.requestedUnits} units)
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {l.status === 'REQUESTED' && (
                      <button
                        onClick={() => updateSharedListingStatus(l.id, 'IN_TRANSIT')}
                        className="px-4 py-2 text-xs font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg"
                      >
                        Approve & Dispatch
                      </button>
                    )}
                    {l.status === 'IN_TRANSIT' && (
                      <button
                        onClick={() => updateSharedListingStatus(l.id, 'COMPLETED')}
                        className="px-4 py-2 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg"
                      >
                        Mark Completed
                      </button>
                    )}
                    <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#FAFAF9] border border-[#E7E5E4] text-[#1C1917]">
                      {l.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: POST SURPLUS MEDICINE FORM */}
      {activeTab === 'post' && (
        <div className="max-w-xl mx-auto bg-white border border-[#E7E5E4] rounded-xl p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="space-y-1 border-b border-[#E7E5E4] pb-4">
            <h3 className="font-bold text-base text-[#1C1917]">List Surplus Medicine to Chemist Exchange</h3>
            <p className="text-xs text-[#78716C]">
              Share slow-moving inventory with nearby retail chemists before expiry.
            </p>
          </div>

          <form onSubmit={handleCreateListing} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#1C1917] mb-1">Select Medicine</label>
              <select
                value={postMedSku}
                onChange={(e) => setPostMedSku(e.target.value)}
                className="w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg p-2.5 text-xs text-[#1C1917] focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
              >
                {medicines.map((m) => (
                  <option key={m.id} value={m.sku}>
                    {m.brandName || m.genericName} — {m.sku}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#1C1917] mb-1">Batch Number</label>
                <input
                  type="text"
                  required
                  value={postBatchCode}
                  onChange={(e) => setPostBatchCode(e.target.value)}
                  placeholder="e.g. CTX-2026-RET"
                  className="w-full bg-white border border-[#E7E5E4] rounded-lg p-2.5 font-mono text-xs focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1C1917] mb-1">Expiration Date</label>
                <input
                  type="date"
                  required
                  value={postExpiryDate}
                  onChange={(e) => setPostExpiryDate(e.target.value)}
                  className="w-full bg-white border border-[#E7E5E4] rounded-lg p-2.5 font-mono text-xs focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#1C1917] mb-1">Units Available to Share</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={postUnits}
                  onChange={(e) => setPostUnits(parseInt(e.target.value) || 1)}
                  className="w-full bg-white border border-[#E7E5E4] rounded-lg p-2.5 font-mono text-xs focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1C1917] mb-1">Peer Discount %</label>
                <input
                  type="number"
                  min="5"
                  max="70"
                  required
                  value={postDiscount}
                  onChange={(e) => setPostDiscount(parseInt(e.target.value) || 30)}
                  className="w-full bg-white border border-[#E7E5E4] rounded-lg p-2.5 font-mono text-xs focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#1C1917] mb-1">Chemist Notes / Delivery Details</label>
              <textarea
                rows={2}
                value={postNotes}
                onChange={(e) => setPostNotes(e.target.value)}
                placeholder="e.g. Can deliver within 3km or available for counter pickup..."
                className="w-full bg-white border border-[#E7E5E4] rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
              />
            </div>

            {postSuccess && (
              <div className="p-3 bg-[#DCFCE7] border border-[#BBF7D0] rounded-lg text-[#15803D] font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Successfully published to local chemist sharing board!</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('exchange')}
                className="px-4 py-2 text-xs font-semibold text-[#78716C]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg shadow-xs"
              >
                Publish to Network
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REQUEST STOCK MODAL */}
      {isRequestModalOpen && selectedListingForRequest && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-[#E7E5E4] overflow-hidden">
            <div className="p-4 border-b border-[#E7E5E4] bg-[#FAFAF9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#C2410C]" />
                <h3 className="font-bold text-sm text-[#1C1917]">Request Medicine from Peer Chemist</h3>
              </div>
              <button onClick={() => setIsRequestModalOpen(false)} className="text-[#78716C] p-1">
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmRequest} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg space-y-1">
                <div className="font-bold text-[#1C1917]">{selectedListingForRequest.medicineName}</div>
                <div className="text-[11px] text-[#78716C]">
                  Seller: <strong>{selectedListingForRequest.ownerStoreName}</strong> ({selectedListingForRequest.ownerOwnerName})
                </div>
                <div className="text-[11px] text-[#C2410C] font-mono">
                  Expires: {selectedListingForRequest.expiresOn} &bull; {selectedListingForRequest.discountPercent}% Discount
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1C1917] mb-1">
                  Units Needed (Max: {selectedListingForRequest.availableUnits})
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedListingForRequest.availableUnits}
                  value={requestQty}
                  onChange={(e) => setRequestQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-white border border-[#E7E5E4] rounded-lg p-2.5 font-mono text-sm focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1C1917] mb-1">Message / Prescription Urgency</label>
                <textarea
                  rows={2}
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  className="w-full bg-white border border-[#E7E5E4] rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E7E5E4]">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#78716C]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg shadow-xs"
                >
                  Send Claim Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
