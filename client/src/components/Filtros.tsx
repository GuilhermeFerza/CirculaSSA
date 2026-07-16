import '../App.css'
import { Filter } from 'lucide-react'

interface FiltrosProps{
    mostrarFiltros: boolean
    filtrosAtivos: string[]
    alternarFiltro: (tipo: string) => void
    bairrosDisponiveis: string[]
    mostrarBairro: string
    setMostrarBairro: (smb: string) => void
    setMostrarFiltros: (smf: boolean) => void
    termoBusca: string
    setTermoBusca: (stb: string) => void
}

export default function Filtros({mostrarFiltros, filtrosAtivos, alternarFiltro, bairrosDisponiveis, mostrarBairro, setMostrarBairro, setMostrarFiltros, termoBusca, setTermoBusca}:FiltrosProps){
    return(
        <>

            <button 
                className={`btn-abrir-filtros ${mostrarFiltros ? 'ativo' : ''}`}
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
            >
                <Filter size={20} />
            </button>
            
            {mostrarFiltros &&(
                <div className="painel-filtros">
                    <div style={{ marginBottom: '20px' }}>
                        <input 
                            type="text" 
                            placeholder="Buscar vaga por título..." 
                            value={termoBusca}
                            onChange={(e) => setTermoBusca(e.target.value)}
                            className="select-bairro" // Reaproveitando a classe para manter o estilo visual
                            style={{ backgroundImage: 'none', paddingRight: '16px' }} // Removendo a setinha do select
                        />
                    </div>
                    <h3>Mostrar oportunidades do tipo</h3>
                    <div className="chips-container">
                        {['Estágio', 'CLT', 'Jovem Aprendiz', 'Mutirão'].map(tipo => (
                            <button
                                key={tipo}
                                className={`chip-filtro ${filtrosAtivos.includes(tipo) ? 'ativo' : ''}`}
                                onClick={()=> alternarFiltro(tipo)}
                            >
                                {tipo}
                            </button>
                        ))}
                    </div>
                    {bairrosDisponiveis.length > 0 &&(
                        <div style={{ marginTop: '20px'}}>
                            <h3>Filtrar por Bairro</h3>
                            <select
                                className="select-bairro"
                                value={mostrarBairro}
                                onChange={(e)=> setMostrarBairro(e.target.value)}
                            >
                                <option value=''>Todos os Bairros</option>
                                {bairrosDisponiveis.map(bairro => (
                                    <option key={bairro} value={bairro}>
                                        {bairro}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}

        </>
    )
}