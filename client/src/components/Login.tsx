import { AlertTriangle } from "lucide-react"
import React, { useState } from "react"

interface LoginProps{
    setAbaAtiva: (saa: string) => void
}

export default function Login({setAbaAtiva}:LoginProps){

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');


    const handleSubmit = async (e: React.FormEvent) =>{
        e.preventDefault();
        const dadosUser = {
            email,
            password,
        }
        

        try{
            const response = await fetch("http://localhost:8080/api/login", {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(dadosUser)
            });
            
            if(response.ok){
                const data = await response.json();
                localStorage.setItem('token', data.token)
                setAbaAtiva('mapa')
            }else{
                alert("Email ou senha incorreto")
            }
        }catch(error){
            console.error("Erro na req:", error)
            alert("Não foi possível conectar ao servidor.")
        }
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
                        <input type="password" placeholder="Digite sua senha" value={password} onChange={(e)=> setPassword(e.target.value)} required />
                    </div>

                    <button type="submit" className="btn-submit">
                        Entrar
                    </button>
                </form>
                
                <div className="links-adicionais">
                <p>senhas não coincidem</p>
                <a href="#">Esqueci minha senha</a>
                <a href="#">Criar uma nova conta</a>
                </div>
            </div>
        </div>
    )
}