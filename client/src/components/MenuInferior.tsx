import { Map, Bookmark, PersonStanding, PlusCircle, User} from 'lucide-react'


interface MenuInferiorProps{
    perfilUsuario: string;
    abaAtiva: string;
    setAbaAtiva: (aba: string) => void
    setMostrarFiltros: (Mfil: boolean) => void
}



export default function MenuInferior({ perfilUsuario, abaAtiva, setMostrarFiltros, setAbaAtiva}: MenuInferiorProps){

    const tipo = localStorage.getItem('perfilUsuario')

    return(
        <>
            {perfilUsuario && (
                <nav className='bottom-nav'>

                    {tipo === 'candidato' && (
                        <>
                            <button
                                className={`nav-item ${abaAtiva === 'mapa' ? 'ativo': ''}`}
                                onClick={() => {
                                    setAbaAtiva('mapa');
                                    setMostrarFiltros(false);
                                }}
                            >
                                <Map size={22}/> Mapa
                            </button>
                            <button
                                className={`nav-item ${abaAtiva === 'salvas' ? 'ativo' : ''}`}
                                onClick={() => {
                                    setAbaAtiva('salvas');
                                    setMostrarFiltros(false);
                                }
                            }
                            >
                                <PersonStanding size={22} /> Salvas
                            </button>
                        </>
                    )}
                    
                    {tipo === 'empresa' && (
                        <>
                            <button
                                className={`nav-item ${abaAtiva === 'mapa' ? 'ativo' : ''}`}
                                onClick={ () => {
                                    setAbaAtiva('mapa');
                                    setMostrarFiltros(false);
                                }}
                            >
                                <Map size={22}/> Mapa
                            </button>
                            <button
                                className={`nav-item ${abaAtiva === 'painel-empresa' ? 'ativo' : ''}`}
                                onClick={ () => {
                                    setAbaAtiva('painel-empresa');
                                    setMostrarFiltros(false);
                                }}
                            >   
                                <Bookmark size={22} /> Minhas Vagas
                            </button>
                            <button
                                className={`nav-item ${abaAtiva === 'nova-vaga' ? 'ativo' : ''}`}
                                onClick={() => {
                                    setAbaAtiva('nova-vaga');
                                    setMostrarFiltros(false);
                                }}
                            >
                                <PlusCircle size={22} /> Nova Vaga
                            </button>
                        </>

                    )}
                    <button
                        className={`nav-item ${abaAtiva === 'perfil' ? 'ativo' : ''}`}
                        onClick={() => 
                            {
                                setAbaAtiva('perfil');
                                setMostrarFiltros(false);
                            }}
                    >
                        <User size={22} /> Perfil
                    </button>
                </nav>
            )}
        </>  
    );
}