import { useState, useMemo } from 'react';
import { useOverview as useOverviewHook } from '../hooks/useOverview';
import { useMenuItem } from '../hooks/useMenuItem';
import { MenuCategory, MENU_CATEGORY_LABELS } from '@resbar/shared';
import MenuKPIs from '../components/dashboard/MenuKPIs';
import MenuAlerts from '../components/dashboard/MenuAlerts';
import MenuTopItems from '../components/dashboard/MenuTopItems';
import MenuStrategicMatrix from '../components/dashboard/MenuStrategicMatrix';
import MenuPerformance from '../components/dashboard/MenuPerformance';
import MenuOperationalImpact from '../components/dashboard/MenuOperationalImpact';
import formatCurrency from '../lib/formatCurrency';

type Period = 'today' | '7d' | '30d';

function toISO(date: Date) {
  return date.toISOString();
}

export default function DashboardMenu() {
  const [period, setPeriod] = useState<Period>('today');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const { useOverviewMenu, useMenuItemMetrics } = useOverviewHook();
  const { useMenuItems } = useMenuItem();

  // Buscar todos os itens do menu para autocomplete
  const allMenuItemsQuery = useMenuItems({});
  const allMenuItems = allMenuItemsQuery.data || [];

  // Filtrar itens para autocomplete
  const filteredSuggestions = useMemo(() => {
    if (!nameFilter) return [];
    
    return allMenuItems.filter((item: any) => {
      const matchesName = item.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      return matchesName && matchesCategory;
    }).slice(0, 10);
  }, [nameFilter, categoryFilter, allMenuItems]);

  const { start, end } = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    const start7 = new Date(now);
    start7.setDate(start7.getDate() - 6);
    start7.setHours(0, 0, 0, 0);
    const start30 = new Date(now);
    start30.setDate(start30.getDate() - 29);
    start30.setHours(0, 0, 0, 0);

    if (period === 'today') return { start: toISO(startToday), end: toISO(now) };
    if (period === '7d') return { start: toISO(start7), end: toISO(now) };
    if (period === '30d') return { start: toISO(start30), end: toISO(now) };
    return { start: toISO(startToday), end: toISO(now) };
  }, [period]);

  const menuQ = useOverviewMenu({ start, end });
  const itemMetricsQ = useMenuItemMetrics(selectedItemId, { start, end });

  const handleSearchItem = () => {
    if (filteredSuggestions.length > 0) {
      setSelectedItemId(filteredSuggestions[0].id);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = allMenuItems.find((i: any) => i.id === itemId);
    if (item) {
      setNameFilter(item.name);
    }
    setShowSuggestions(false);
  };

  const handleBackToOverview = () => {
    setSelectedItemId(null);
    setNameFilter('');
    setCategoryFilter('all');
  };

  if (menuQ.isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-red-800 mb-2">Erro ao carregar Análise do Cardápio</h2>
        <div className="text-red-600 mb-1">{(menuQ.error as any)?.message ?? String(menuQ.error)}</div>
        <div className="mt-3 text-sm text-red-700">Verifique a API ou suas permissões de administrador.</div>
      </div>
    );
  }

  if (menuQ.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
          <p className="text-gray-600">Carregando análise do cardápio...</p>
        </div>
      </div>
    );
  }

  const data = menuQ.data!;

  // Se um item foi selecionado e temos suas métricas, mostrar visualização detalhada
  if (selectedItemId && itemMetricsQ.data) {
    const itemData = itemMetricsQ.data;
    const item = itemData.item;
    const metrics = itemData.metrics;

    return (
      <div className="p-4 space-y-6">
        {/* Header com botão de voltar */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBackToOverview}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors"
          >
            ← Voltar
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">📊 {item.name}</h1>
            <p className="text-gray-500 mt-1">
              {MENU_CATEGORY_LABELS[item.category as MenuCategory]} • {formatCurrency(item.price)}
              {!item.available && <span className="ml-2 text-red-600 font-medium">(Indisponível)</span>}
            </p>
          </div>
        </div>

        {/* КПIs do Item */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Quantidade Vendida</div>
            <div className="text-2xl font-bold text-gray-800">{metrics.sales.totalQuantity}</div>
            {metrics.comparison.quantityChange !== 0 && (
              <div className={`text-xs mt-1 ${metrics.comparison.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.comparison.quantityChange > 0 ? '↑' : '↓'} {Math.abs(metrics.comparison.quantityChange).toFixed(1)}% vs período anterior
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Receita Total</div>
            <div className="text-2xl font-bold text-gray-800">{formatCurrency(metrics.sales.totalRevenue)}</div>
            {metrics.comparison.revenueChange !== 0 && (
              <div className={`text-xs mt-1 ${metrics.comparison.revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.comparison.revenueChange > 0 ? '↑' : '↓'} {Math.abs(metrics.comparison.revenueChange).toFixed(1)}% vs período anterior
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Tempo Médio de Preparo</div>
            <div className="text-2xl font-bold text-gray-800">{metrics.prepTime.avgPrepMinutes.toFixed(1)} min</div>
            <div className="text-xs text-gray-500 mt-1">
              Min: {metrics.prepTime.minPrepMinutes.toFixed(1)} | Máx: {metrics.prepTime.maxPrepMinutes.toFixed(1)}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Taxa de Atraso</div>
            <div className={`text-2xl font-bold ${metrics.prepTime.delayPercentage > 30 ? 'text-red-600' : 'text-gray-800'}`}>
              {metrics.prepTime.delayPercentage.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {metrics.prepTime.delayedOrders} de {metrics.prepTime.totalOrdersWithTime} pedidos
            </div>
          </div>
        </div>

        {/* Métricas Adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Pedidos</div>
            <div className="text-xl font-bold text-gray-800">{metrics.sales.ordersCount}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Comandas Únicas</div>
            <div className="text-xl font-bold text-gray-800">{metrics.sales.uniqueTabs}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Taxa de Conversão</div>
            <div className="text-xl font-bold text-gray-800">{metrics.sales.conversionRate.toFixed(1)}%</div>
          </div>
        </div>

        {/* Ranking */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold mb-3">🏆 Ranking na Categoria</h3>
          <div className="text-gray-700">
            <span className="text-2xl font-bold text-purple-600">#{metrics.ranking.rankInCategory}</span>
            <span className="text-gray-500 ml-2">de {metrics.ranking.totalInCategory} itens em {MENU_CATEGORY_LABELS[metrics.ranking.categoryName as MenuCategory]}</span>
          </div>
        </div>

        {/* Distribuição por Horário */}
        {metrics.trends.hourlyDistribution.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">⏰ Distribuição por Horário</h3>
            <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
              {metrics.trends.hourlyDistribution.map((h: any) => (
                <div key={h.hour} className="text-center">
                  <div className="text-xs text-gray-500">{h.hour}h</div>
                  <div className="text-sm font-bold text-gray-800">{h.totalQuantity}</div>
                  <div className="text-xs text-gray-500">{formatCurrency(h.totalRevenue)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tendência Diária */}
        {metrics.trends.dailyTrend.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">📈 Tendência Diária</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 px-3">Data</th>
                    <th className="py-2 px-3 text-right">Quantidade</th>
                    <th className="py-2 px-3 text-right">Receita</th>
                    <th className="py-2 px-3 text-right">Pedidos</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.trends.dailyTrend.map((d: any) => (
                    <tr key={d.date} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">{new Date(d.date).toLocaleDateString('pt-BR')}</td>
                      <td className="py-2 px-3 text-right font-medium">{d.totalQuantity}</td>
                      <td className="py-2 px-3 text-right font-bold">{formatCurrency(d.totalRevenue)}</td>
                      <td className="py-2 px-3 text-right">{d.ordersCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Visualização Geral do Dashboard de Menu

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🍽 Análise do Cardápio</h1>
          <p className="text-gray-500 mt-1">Performance de itens, receita e impacto operacional</p>
        </div>

        {/* Filtros de período */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('today')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'today' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setPeriod('7d')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === '7d' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            7 Dias
          </button>
          <button
            onClick={() => setPeriod('30d')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === '30d' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            30 Dias
          </button>
        </div>
      </div>

      {/* Filtros de Busca */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 relative">
            <label className="block text-xs text-gray-600 mb-1">Buscar por nome do prato</label>
            <input
              value={nameFilter}
              onChange={(e) => {
                setNameFilter(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Digite o nome do prato..."
              className="border rounded-lg p-2 text-sm w-full"
            />
            
            {/* Autocomplete Suggestions */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredSuggestions.map((item: any) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectSuggestion(item.id)}
                    className="px-4 py-3 hover:bg-purple-50 cursor-pointer border-b last:border-b-0"
                  >
                    <div className="font-medium text-gray-800">{item.name}</div>
                    <div className="text-xs text-gray-500">
                      {MENU_CATEGORY_LABELS[item.category as MenuCategory]} • {formatCurrency(item.price)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Categoria</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border rounded-lg p-2 text-sm w-48"
            >
              <option value="all">Todas as categorias</option>
              {Object.entries(MENU_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSearchItem}
            disabled={filteredSuggestions.length === 0}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {/* Magnifying glass icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <span>Analisar Item</span>
          </button>
        </div>
      </div>

      {/* 1️⃣ KPIs DO CARDÁPIO */}
      <div className="mb-8">
        <MenuKPIs
          totalRevenue={data.kpis.totalRevenue}
          totalItems={data.kpis.totalItems}
          unavailableCount={data.kpis.unavailableCount}
          avgPrepTime={data.kpis.avgPrepTime}
          concentrationRatio={data.kpis.concentrationRatio}
        />
      </div>

      {/* 2️⃣ ALERTAS DO CARDÁPIO */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="mb-8">
          <MenuAlerts alerts={data.alerts} />
        </div>
      )}

      {/* 3️⃣ TOP ITENS E RECEITA POR CATEGORIA */}
      {data.topItems && data.categoryDistribution && (
        <div className="mb-8">
          <MenuTopItems
            byVolume={data.topItems.byVolume}
            byRevenue={data.topItems.byRevenue}
            categoryDistribution={data.categoryDistribution}
          />
        </div>
      )}

      {/* 4️⃣ ANÁLISE ESTRATÉGICA */}
      {data.strategicMatrix && data.bottlenecks && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">📊 Análise Estratégica</h2>
          <MenuStrategicMatrix
            strategicMatrix={data.strategicMatrix}
            bottlenecks={data.bottlenecks}
          />
        </div>
      )}

      {/* 5️⃣ PERFORMANCE E DISPONIBILIDADE */}
      {data.lowVolumeItems && data.unavailableItems && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">📉 Performance e Disponibilidade</h2>
          <MenuPerformance
            lowVolumeItems={data.lowVolumeItems}
            unavailableItems={data.unavailableItems}
          />
        </div>
      )}

      {/* 6️⃣ IMPACTO OPERACIONAL */}
      {data.categoryPrepTime && data.itemDelayRate && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">⚙️ Impacto Operacional</h2>
          <MenuOperationalImpact
            categoryPrepTime={data.categoryPrepTime}
            itemDelayRate={data.itemDelayRate}
          />
        </div>
      )}

      {/* Link de volta */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <a href="/dashboard/overview" className="text-purple-600 hover:text-purple-700 hover:underline">
          ← Voltar para Visão Geral
        </a>
      </div>
    </div>
  );
}
