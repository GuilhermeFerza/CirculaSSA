import React, { useState } from "react"
import toast from "react-hot-toast"


interface LoginProps{
    setAbaAtiva: (saa : string) => void
}

export default function Login({setAbaAtiva}: LoginProps){

    const [name, setName]=useState('');
    const [email, setEmail]=useState('');
    const [password, setPassword]=useState('');
    const [checkPass, setCheckPass] = useState('');
    const [type, setType] = useState("candidato");

    const [aviso, setAviso] = useState('aviso')

    const handleSubmit = async (e: React.FormEvent)=>{
        e.preventDefault()
    
        const tipo =  localStorage.getItem('perfilUsuario') || '';
        setType(tipo)

        if (password !== checkPass){
            setAviso("aviso ativo");
            return;
        }

        const dadosUser = {
            name,
            email,
            password,
            type: tipo,
        }
        
            try{
                const response = await fetch("http://localhost:8080/api/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(dadosUser),
                });
                if(response.ok){
                    toast.success("Conta criada com sucesso!");
                    setAbaAtiva('login');
                }else{
                    toast.error("Falha ao criar usuário");
                }
            }catch(error){
                console.error("Erro na req:", error)
                toast.error("Não foi possível conectar ao servidor.")
            }   

    }
    return(
        <div className="login-container">
            <div className="login-card">
                <h2>Circula<span>SSA</span></h2>
                <p className="subtitulo">Acesse sua conta para continuar</p>

                <form className="form-login" onSubmit={handleSubmit}>
                    <div className="grupo-input">
                        <label>Nome de Usuario</label>
                        <input type="text" placeholder="Digite seu nome" value={name} onChange={(e)=> setName(e.target.value)} required />
                    </div>
                   
                    <div className="grupo-input">
                        <label>E-mail</label>
                        <input type="email" placeholder="Digite seu e-mail" value={email} onChange={(e)=> setEmail(e.target.value)} required />
                    </div>

                    <div className="grupo-input">
                        <label>Senha</label>
                        <input type="password" placeholder="Digite sua senha" value={password} onChange={(e)=> setPassword(e.target.value)} required />
                    </div>
                    <div className="grupo-input">
                        <label>Confirme a Senha</label>
                        <input type="password" placeholder="Digite sua senha" value={checkPass} onChange={(e)=> setCheckPass(e.target.value)} required />
                    </div>


                    <button type="submit" className="btn-submit">
                        Registrar
                    </button>
                </form>
                
                <div className="links-adicionais">
                <p className={aviso}>senhas não coincidem</p>
                <a href="#">Esqueci minha senha</a>
                <a style={{cursor: 'pointer'}} onClick={(e)=> {e.preventDefault(); setAbaAtiva('login')}}>Já tenho uma conta</a>
                </div>
            </div>
        </div>
    )
}