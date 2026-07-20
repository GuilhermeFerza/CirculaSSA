import React, { useState } from "react"
import toast from "react-hot-toast"
import { fetchAuth } from '../utils/api';
import { Eye, EyeOff } from "lucide-react"

interface LoginProps{
    setAbaAtiva: (saa: string) => void
    setPerfilUsuario: (spu: string) => void
}

export default function Login({setAbaAtiva, setPerfilUsuario}:LoginProps){

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [aviso, setAviso] = useState("aviso");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) =>{
        e.preventDefault();

        const dadosUser = {
            email,
            password,
    
        }
        
        setIsSubmitting(true);
        try{
            const API_URL = import.meta.env.VITE_API_URL;
            const response = await fetchAuth(`${API_URL}/api/login`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(dadosUser)
            });
            
            if(response.ok){
                const data = await response.json();
                console.log("AQUI!!!!",data)
                localStorage.setItem('token', data.token);
                localStorage.setItem('perfilUsuario', data.type)
                const perfilEscolhido = localStorage.getItem('perfilUsuario');
                if(perfilEscolhido === 'empresa'){
                    setAbaAtiva('painel-empresa');
                } else{
                    setAbaAtiva('mapa')
                }
            }else{
                setAviso("aviso ativo")
            }
        }catch(error){
            console.error("Erro na req:", error)
            toast.error("Não foi possível conectar ao servidor.")
        }
        setIsSubmitting(false);
    }


    return(
        <div className="login-container">
            <div className="login-card">
                <h2>Circula<span>SSA</span></h2>
                <p className="subtitulo">Acesse sua conta para continuar</p>

                <form className="form-login" onSubmit={handleSubmit}>
                   
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

                    <button type="submit" className="btn-submit">
                        {isSubmitting ? "Enviando..." : "Entrar"}
                    </button>
                </form>
                
                <div className="links-adicionais">
                <p className={aviso}>senhas ou email incorretos</p>
                <a href="#">Esqueci minha senha</a>
                <a style={{cursor: 'pointer'}} onClick={(e)=>{e.preventDefault(); setAbaAtiva('register')}}>Criar uma nova conta</a>
                </div>
            </div>
        </div>
    )
}