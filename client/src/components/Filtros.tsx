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
}

export default function Filtros({mostrarFiltros, filtrosAtivos, alternarFiltro, bairrosDisponiveis, mostrarBairro, setMostrarBairro, setMostrarFiltros}:FiltrosProps){
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
                    <h3>Mostrar oportunidades do tipo</h3>
                    <div className="chips-container">
                        {['Estágio', 'CLT', 'Jovem Aprendiz', 'Mutirão'].map(tipo => (
                            <button
                                key={tipo}
                                className={`chip-filtro ${filtrosAtivos.includes(tipo) ? 'ativo' : ''}`}
                                onClick={()=> alternarFiltro}
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