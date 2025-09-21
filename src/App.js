import React, { useState } from 'react';
import { Plus, Calendar, TrendingUp } from 'lucide-react';
import { start } from 'repl';

const PassTrack = () => {
  const [packs, setPacks] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showUsageNumbers, setShowUsageNumbers] = useState(false);
  const [newPack, setNewPack] = useState({
    place: '',
    totalSessions: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    neverExpires: false,
    cost: '',
    notes: ''
  });

  // Predefined distinct colors for studios
  const studioColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
    '#F1948A', '#85929E', '#D2B4DE', '#A3E4D7', '#F9E79F', '#AED6F1'
  ];

  // Helper function to get consistent color for a studio
  const getStudioColor = (studioName) => {
    const allStudios = [...new Set(packs.map(pack => pack.place))].sort();
    const studioIndex = allStudios.indexOf(studioName);
    return studioColors[studioIndex % studioColors.length];
  };

  const addPack = () => {
    if (newPack.place && newPack.totalSessions) {
      const pack = {
        id: Date.now(),
        place: newPack.place,
        totalSessions: parseInt(newPack.totalSessions),
        remainingSessions: parseInt(newPack.totalSessions),
        purchaseDate: newPack.purchaseDate,
        expiryDate: newPack.neverExpires ? null : newPack.expiryDate,
        neverExpires: newPack.neverExpires,
        cost: newPack.cost ? parseFloat(newPack.cost) : null,
        notes: newPack.notes,
        usageHistory: [],
        purchaseHistory: [{
          date: newPack.purchaseDate,
          sessions: parseInt(newPack.totalSessions),
          cost: newPack.cost ? parseFloat(newPack.cost) : 0
        }]
      };
      setPacks([...packs, pack]);
      setNewPack({ 
        place: '', 
        totalSessions: '', 
        purchaseDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        neverExpires: false,
        cost: '',
        notes: ''
      });
      setShowAddForm(false);
    }
  };

  const usePassSession = (packId) => {
    setPacks(packs.map(pack => {
      if (pack.id === packId && pack.remainingSessions > 0) {
        return {
          ...pack,
          remainingSessions: pack.remainingSessions - 1,
          usageHistory: [...pack.usageHistory, new Date().toISOString().split('T')[0]]
        };
      }
      return pack;
    }));
  };

  const addSessions = (packId, additionalSessions, additionalCost = 0) => {
    setPacks(packs.map(pack => {
      if (pack.id === packId) {
        return {
          ...pack,
          totalSessions: pack.totalSessions + additionalSessions,
          remainingSessions: pack.remainingSessions + additionalSessions,
          cost: (pack.cost || 0) + additionalCost,
          purchaseHistory: [
            ...(pack.purchaseHistory || []),
            {
              date: new Date().toISOString().split('T')[0],
              sessions: additionalSessions,
              cost: additionalCost
            }
          ]
        };
      }
      return pack;
    }));
  };

  const currentYear = new Date().getFullYear();
  const totalRemaining = packs.reduce((total, pack) => total + pack.remainingSessions, 0);
  
  const totalSpentThisYear = packs.reduce((total, pack) => {
    if (pack.cost && new Date(pack.purchaseDate).getFullYear() === currentYear) {
      return total + pack.cost;
    }
    return total;
  }, 0);

  // Calculate usage distribution for pie chart
  const usageDistribution = packs.reduce((acc, pack) => {
    const thisYearUsage = pack.usageHistory.filter(date => 
      new Date(date).getFullYear() === currentYear
    ).length;
    
    if (thisYearUsage > 0) {
      acc.push({
        name: pack.place,
        value: thisYearUsage,
        color: getStudioColor(pack.place)
      });
    }
    return acc;
  }, []);

  const expiringPacks = packs.filter(pack => {
    if (!pack.expiryDate || pack.remainingSessions === 0 || pack.neverExpires) return false;
    const daysUntilExpiry = Math.ceil((new Date(pack.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  });

  // Simple pie chart component using SVG
  const SimplePieChart = ({ data, size = 64 }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    const radius = size / 2 - 2;
    const centerX = size / 2;
    const centerY = size / 2;

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((item, index) => {
          const sliceAngle = (item.value / total) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + sliceAngle;
          
          const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
          const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
          const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
          const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
          
          const largeArcFlag = sliceAngle > 180 ? 1 : 0;
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');

          currentAngle += sliceAngle;

          return (
            <path
              key={index}
              d={pathData}
              fill={item.color}
              stroke="white"
              strokeWidth="1"
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <style>
        {`
          input[type="number"]::-webkit-outer-spin-button,
          input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type="number"] {
            -moz-appearance: textfield;
          }
        `}
      </style>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-indigo-900 mb-2">Pass Track</h1>
          <p className="text-indigo-600">Keep track of your class passes</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Your Stats</h2>
            <button
              onClick={() => setShowStats(!showStats)}
              className="text-indigo-600 hover:text-indigo-800"
            >
              <TrendingUp size={20} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalRemaining}</div>
              <div className="text-sm text-gray-600">Sessions Left</div>
            </div>
            <div className="text-center">
              {usageDistribution.length > 0 ? (
                <div 
                  className="cursor-pointer flex flex-col items-center"
                  onClick={() => setShowUsageNumbers(!showUsageNumbers)}
                >
                  {showUsageNumbers ? (
                    <div className="space-y-1 min-h-[64px] flex flex-col justify-center">
                      {usageDistribution.map((item, index) => (
                        <div key={index} className="text-xs flex items-center justify-center gap-1">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="font-semibold">{item.name}:</span> {item.value}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-16 w-16 mx-auto flex items-center justify-center">
                      <SimplePieChart data={usageDistribution} size={64} />
                    </div>
                  )}
                  <div className="text-sm text-gray-600 mt-1">
                    {showUsageNumbers ? 'Click for chart' : 'Usage by Studio'}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-600">Used in {currentYear}</div>
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">${totalSpentThisYear.toFixed(0)}</div>
              <div className="text-sm text-gray-600">Spent in {currentYear}</div>
            </div>
          </div>
        </div>

        {expiringPacks.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-yellow-800 font-semibold mb-2 flex items-center gap-2">
              ⚠️ Expiring Soon
            </h3>
            {expiringPacks.map(pack => {
              const daysUntilExpiry = Math.ceil((new Date(pack.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={pack.id} className="text-yellow-700 text-sm">
                  <strong>{pack.place}</strong> expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''} ({pack.remainingSessions} sessions left)
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium mb-6 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          Add New Pass Pack
        </button>

        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">New Pass Pack</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Place/Studio Name"
                value={newPack.place}
                onChange={(e) => setNewPack({...newPack, place: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Number of Sessions"
                value={newPack.totalSessions}
                onChange={(e) => setNewPack({...newPack, totalSessions: e.target.value})}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={newPack.purchaseDate}
                    onChange={(e) => setNewPack({...newPack, purchaseDate: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newPack.expiryDate}
                    onChange={(e) => setNewPack({...newPack, expiryDate: e.target.value})}
                    disabled={newPack.neverExpires}
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      newPack.neverExpires ? 'bg-gray-100 text-gray-400' : ''
                    }`}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="neverExpires"
                  checked={newPack.neverExpires}
                  onChange={(e) => setNewPack({
                    ...newPack, 
                    neverExpires: e.target.checked,
                    expiryDate: e.target.checked ? '' : newPack.expiryDate
                  })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="neverExpires" className="text-sm text-gray-700">
                  ✨ This pass never expires
                </label>
              </div>
              <input
                type="number"
                step="0.01"
                placeholder="Cost (optional)"
                value={newPack.cost}
                onChange={(e) => setNewPack({...newPack, cost: e.target.value})}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <textarea
                placeholder="Notes (optional)"
                value={newPack.notes}
                onChange={(e) => setNewPack({...newPack, notes: e.target.value})}
                rows="2"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={addPack}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Pack
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {packs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p>No pass packs yet. Add your first one above!</p>
            </div>
          ) : (
            packs.map(pack => (
              <PackCard 
                key={pack.id} 
                pack={pack} 
                onUseSession={() => usePassSession(pack.id)}
                onAddSessions={(additional, cost) => addSessions(pack.id, additional, cost)}
                studioColor={getStudioColor(pack.place)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const PackCard = ({ pack, onUseSession, onAddSessions, studioColor }) => {
  const [showAddMore, setShowAddMore] = useState(false);
  const [additionalSessions, setAdditionalSessions] = useState('');
  const [additionalCost, setAdditionalCost] = useState('');

  const progressPercentage = (pack.remainingSessions / pack.totalSessions) * 100;
  const isLow = pack.remainingSessions <= 2 && pack.remainingSessions > 0;
  const isEmpty = pack.remainingSessions === 0;
  
  const isExpired = pack.expiryDate && !pack.neverExpires && new Date(pack.expiryDate) < new Date();
  const isExpiringSoon = pack.expiryDate && !pack.neverExpires && !isExpired && 
    Math.ceil((new Date(pack.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) <= 7;

  const handleAddMore = () => {
    if (additionalSessions && parseInt(additionalSessions) > 0) {
      const sessions = parseInt(additionalSessions);
      const cost = additionalCost ? parseFloat(additionalCost) : 0;
      onAddSessions(sessions, cost);
      setAdditionalSessions('');
      setAdditionalCost('');
      setShowAddMore(false);
    }
  };

  const getBorderColor = () => {
    if (isExpired) return 'border-red-500';
    if (isEmpty) return 'border-red-500';
    if (isExpiringSoon || isLow) return 'border-yellow-500';
    return 'border-green-500';
  };

  const getExpiryInfo = () => {
    if (pack.neverExpires) {
      return <span className="text-green-600 font-medium">✨ Never expires</span>;
    }
    
    if (!pack.expiryDate) return null;
    
    const daysUntilExpiry = Math.ceil((new Date(pack.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (isExpired) {
      return <span className="text-red-600 font-medium">Expired</span>;
    } else if (isExpiringSoon) {
      return <span className="text-yellow-600 font-medium">Expires in {daysUntilExpiry} days</span>;
    } else {
      return <span className="text-gray-600">Expires {new Date(pack.expiryDate).toLocaleDateString()}</span>;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${getBorderColor()}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: studioColor }}
            ></div>
            {pack.place}
          </h3>
          <p className="text-sm text-gray-600">
            Purchased: {new Date(pack.purchaseDate).toLocaleDateString()}
          </p>
          {(pack.expiryDate || pack.neverExpires) && (
            <p className="text-sm">
              {getExpiryInfo()}
            </p>
          )}
          {pack.cost && (
            <p className="text-sm text-gray-600">
              Cost: ${pack.cost.toFixed(2)}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${
            isExpired || isEmpty ? 'text-red-600' : 
            isExpiringSoon || isLow ? 'text-yellow-600' : 
            'text-green-600'
          }`}>
            {pack.remainingSessions}
          </div>
          <div className="text-sm text-gray-600">left</div>
        </div>
      </div>

      {pack.notes && (
        <div className="mb-3 p-2 bg-blue-50 rounded border-l-2 border-blue-200">
          <p className="text-sm text-blue-800">{pack.notes}</p>
        </div>
      )}

      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            isExpired || isEmpty ? 'bg-red-500' : 
            isExpiringSoon || isLow ? 'bg-yellow-500' : 
            'bg-green-500'
          }`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onUseSession}
          disabled={pack.remainingSessions === 0 || isExpired}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            pack.remainingSessions === 0 || isExpired
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isExpired ? 'Expired' : 
           pack.remainingSessions === 0 ? 'No Sessions Left' : 
           'Use Session'}
        </button>
        <button
          onClick={() => setShowAddMore(!showAddMore)}
          className="bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      {showAddMore && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Add More Sessions</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Number of Sessions</label>
              <input
                type="number"
                placeholder="e.g. 4"
                value={additionalSessions}
                onChange={(e) => setAdditionalSessions(e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cost for These Sessions</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 200.00"
                value={additionalCost}
                onChange={(e) => setAdditionalCost(e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleAddMore}
                disabled={!additionalSessions}
                className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                  additionalSessions 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Add Sessions
              </button>
              <button
                onClick={() => {
                  setShowAddMore(false);
                  setAdditionalSessions('');
                  setAdditionalCost('');
                }}
                className="bg-gray-500 text-white py-2 px-3 rounded hover:bg-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 text-sm text-gray-600">
        <span>Total purchased: {pack.totalSessions}</span>
        <span className="mx-2">•</span>
        <span>Used this year: {pack.usageHistory.filter(date => 
          new Date(date).getFullYear() === new Date().getFullYear()
        ).length}</span>
        {pack.cost && (
          <>
            <span className="mx-2">•</span>
            <span>Total cost: ${pack.cost.toFixed(2)}</span>
            <span className="mx-2">•</span>
            <span>Cost per session: ${(pack.cost / pack.totalSessions).toFixed(2)}</span>
          </>
        )}
        {pack.purchaseHistory && pack.purchaseHistory.length > 1 && (
          <div className="mt-1 text-xs">
            <span className="text-blue-600">
              {pack.purchaseHistory.length} separate purchases
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PassTrack;