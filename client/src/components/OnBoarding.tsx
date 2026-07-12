
interface OnBoardingProps{
    perfilUsuario: string;
    setPerfilUsuario: (spu: string) => void
    setAbaAtiva: (saa: string) => void
}

export default function Onboarding( {perfilUsuario, setPerfilUsuario, setAbaAtiva} : OnBoardingProps){
    return( 
        <>
            {!perfilUsuario && (
                <div className='boas-vindas-overlay'>
                    <h1>CirculaSSA</h1>
                    <p>Selecione o seu perfil pra começar:</p>
                    <div className='botoes-perfil'>
                        <button
                            className='btn-perfil candidato'
                            onClick={() => {
                                localStorage.setItem('perfilUsuario', 'candidato');
                                setPerfilUsuario('candidato');
                                setAbaAtiva('mapa')
                            }}
                        >
                            Quero Encontrar Vagas
                        </button>
                        <button
                            className="btn-perfil empresa"
                            onClick={()=>{
                                localStorage.setItem('perfilUsuario', 'empresa');
                                setPerfilUsuario('empresa');
                                setAbaAtiva('painel-empresa');
                            }}
                        >   
                            Quero Anunciar Vagas
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}