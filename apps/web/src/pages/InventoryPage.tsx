export function InventoryPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Estoque</h1>
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed" disabled>
            + Adicionar Item
          </button>
        </div>

        {/* Card de aviso */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🚧</span>
            <div>
              <h3 className="font-bold text-lg mb-2">Funcionalidade em Desenvolvimento</h3>
              <p className="text-gray-700 mb-3">
                O módulo de gestão de estoque está em desenvolvimento. Em breve você poderá:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Cadastrar e gerenciar itens do estoque</li>
                <li>Controlar entrada e saída de produtos</li>
                <li>Definir estoque mínimo e receber alertas</li>
                <li>Vincular ingredientes aos itens do cardápio</li>
                <li>Gerar relatórios de consumo</li>
                <li>Gerenciar fornecedores e pedidos</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Mockup da interface */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex gap-4">
            <input
              type="text"
              placeholder="Buscar item..."
              className="flex-1 border rounded px-3 py-2"
              disabled
            />
            <select className="border rounded px-3 py-2" disabled>
              <option>Todas as Categorias</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Item</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Categoria</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Quantidade</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Unidade</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Estoque Mín.</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b opacity-50">
                  <td className="py-3 px-4">Tomate</td>
                  <td className="py-3 px-4">Legumes</td>
                  <td className="py-3 px-4 text-right">15.5</td>
                  <td className="py-3 px-4 text-right">kg</td>
                  <td className="py-3 px-4 text-right">10.0</td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      Normal
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-blue-500 hover:text-blue-700 mr-2" disabled>
                      Editar
                    </button>
                  </td>
                </tr>
                <tr className="border-b opacity-50">
                  <td className="py-3 px-4">Arroz</td>
                  <td className="py-3 px-4">Grãos</td>
                  <td className="py-3 px-4 text-right">3.0</td>
                  <td className="py-3 px-4 text-right">kg</td>
                  <td className="py-3 px-4 text-right">5.0</td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                      Baixo
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-blue-500 hover:text-blue-700 mr-2" disabled>
                      Editar
                    </button>
                  </td>
                </tr>
                <tr className="border-b opacity-50">
                  <td className="py-3 px-4">Refrigerante Lata</td>
                  <td className="py-3 px-4">Bebidas</td>
                  <td className="py-3 px-4 text-right">48</td>
                  <td className="py-3 px-4 text-right">unidades</td>
                  <td className="py-3 px-4 text-right">24</td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      Normal
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-blue-500 hover:text-blue-700 mr-2" disabled>
                      Editar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t text-center text-gray-500">
            <p>Dados de exemplo - Funcionalidade em breve</p>
          </div>
        </div>
      </div>
    </div>
  );
}
