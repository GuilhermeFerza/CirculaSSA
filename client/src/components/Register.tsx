import React, { useState } from "react"
import toast from "react-hot-toast"
import { Eye, EyeOff } from "lucide-react"


interface LoginProps{
    setAbaAtiva: (saa : string) => void
}

export default function Login({setAbaAtiva}: LoginProps){

    const [name, setName]=useState('');
    const [email, setEmail]=useState('');
    const [password, setPassword]=useState('');
    const [checkPass, setCheckPass] = useState('');
    const [type, setType] = useState("candidato");
    const [showPassword, setShowPassword] = useState(false);
    const [showCheckPass, setShowCheckPass] = useState(false);

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
                const API_URL = import.meta.env.VITE_API_URL;
                const response = await fetch(`${API_URL}/api/register`, {
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
                        <div className="input-senha-container">
                            <input type={showPassword ? "text" : "password"} placeholder="Digite sua senha" value={password} onChange={(e)=> setPassword(e.target.value)} required />
                            <button type="button" className="btn-toggle-senha" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div className="grupo-input">
                        <label>Confirme a Senha</label>
                        <div className="input-senha-container">
                            <input type={showCheckPass ? "text" : "password"} placeholder="confirme sua senha" value={checkPass} onChange={(e)=> setCheckPass(e.target.value)} required />
                            <button type="button" className="btn-toggle-senha" onClick={() => setShowCheckPass(!showCheckPass)}>
                                {showCheckPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
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