import React, { useState } from "react"
import toast from "react-hot-toast"
import { ArrowLeft, Mail, KeyRound, Lock, Eye, EyeOff } from "lucide-react"
import emailjs from "@emailjs/browser"

interface EsqueciSenhaProps {
    setAbaAtiva: (saa: string) => void
}

export default function EsqueciSenha({ setAbaAtiva }: EsqueciSenhaProps) {
    const [etapa, setEtapa] = useState<"email" | "codigo" | "nova-senha">("email")
    const [email, setEmail] = useState("")
    const [codigo, setCodigo] = useState("")
    const [novaSenha, setNovaSenha] = useState("")
    const [confirmarSenha, setConfirmarSenha] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showNovaSenha, setShowNovaSenha] = useState(false)
    const [showConfirmarSenha, setShowConfirmarSenha] = useState(false)

    const API_URL = import.meta.env.VITE_API_URL

    const enviarEmail = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const response = await fetch(`${API_URL}/api/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            })
            const data = await response.json()
            if (response.ok) {
                await emailjs.send(
                    import.meta.env.VITE_EMAILJS_SERVICE_ID,
                    import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
                    { to_email: email, code: data.code },
                    { publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY }
                )
                toast.success("Codigo enviado para seu email!")
                setEtapa("codigo")
            } else {
                toast.error(data.erro || "Erro ao enviar codigo")
            }
        } catch(error) {
            toast.error("Nao foi possivel enviar o email.")
        }
        setIsSubmitting(false)
    }

    const verificarCodigo = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const response = await fetch(`${API_URL}/api/verify-code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code: codigo })
            })
            const data = await response.json()
            if (response.ok) {
                toast.success("Codigo validado!")
                setEtapa("nova-senha")
            } else {
                toast.error(data.erro || "Codigo invalido")
            }
        } catch {
            toast.error("Nao foi possivel conectar ao servidor.")
        }
        setIsSubmitting(false)
    }

    const redefinirSenha = async (e: React.FormEvent) => {
        e.preventDefault()

        if (novaSenha !== confirmarSenha) {
            toast.error("As senhas nao coincidem")
            return
        }

        if (novaSenha.length < 6) {
            toast.error("A senha deve ter no minimo 6 caracteres")
            return
        }

        setIsSubmitting(true)
        try {
            const response = await fetch(`${API_URL}/api/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password: novaSenha })
            })
            const data = await response.json()
            if (response.ok) {
                toast.success("Senha redefinida com sucesso!")
                setAbaAtiva("login")
            } else {
                toast.error(data.erro || "Erro ao redefinir senha")
            }
        } catch {
            toast.error("Nao foi possivel conectar ao servidor.")
        }
        setIsSubmitting(false)
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <button
                    type="button"
                    className="btn-voltar"
                    onClick={() => {
                        if (etapa === "email") setAbaAtiva("login")
                        else if (etapa === "codigo") setEtapa("email")
                        else setEtapa("codigo")
                    }}
                >
                    <ArrowLeft size={20} />
                </button>

                <h2>Circula<span>SSA</span></h2>

                {etapa === "email" && (
                    <>
                        <p className="subtitulo">Digite seu e-mail para receber o codigo</p>
                        <form className="form-login" onSubmit={enviarEmail}>
                            <div className="grupo-input">
                                <label>E-mail</label>
                                <div className="input-icon-container">
                                    <Mail size={18} className="input-icon" />
                                    <input
                                        type="email"
                                        placeholder="Digite seu e-mail"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn-submit" disabled={isSubmitting}>
                                {isSubmitting ? "Enviando..." : "Enviar codigo"}
                            </button>
                        </form>
                    </>
                )}

                {etapa === "codigo" && (
                    <>
                        <p className="subtitulo">Digite o codigo enviado para <strong>{email}</strong></p>
                        <form className="form-login" onSubmit={verificarCodigo}>
                            <div className="grupo-input">
                                <label>Codigo</label>
                                <div className="input-icon-container">
                                    <KeyRound size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder="Digite o codigo de 6 digitos"
                                        value={codigo}
                                        onChange={(e) => setCodigo(e.target.value)}
                                        maxLength={6}
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn-submit" disabled={isSubmitting}>
                                {isSubmitting ? "Verificando..." : "Confirmar codigo"}
                            </button>
                        </form>
                    </>
                )}

                {etapa === "nova-senha" && (
                    <>
                        <p className="subtitulo">Crie uma nova senha</p>
                        <form className="form-login" onSubmit={redefinirSenha}>
                            <div className="grupo-input">
                                <label>Nova senha</label>
                                <div className="input-senha-container">
                                    <input
                                        type={showNovaSenha ? "text" : "password"}
                                        placeholder="Digite a nova senha"
                                        value={novaSenha}
                                        onChange={(e) => setNovaSenha(e.target.value)}
                                        required
                                    />
                                    <button type="button" className="btn-toggle-senha" onClick={() => setShowNovaSenha(!showNovaSenha)}>
                                        {showNovaSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="grupo-input">
                                <label>Confirmar senha</label>
                                <div className="input-senha-container">
                                    <input
                                        type={showConfirmarSenha ? "text" : "password"}
                                        placeholder="Confirme a nova senha"
                                        value={confirmarSenha}
                                        onChange={(e) => setConfirmarSenha(e.target.value)}
                                        required
                                    />
                                    <button type="button" className="btn-toggle-senha" onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}>
                                        {showConfirmarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="btn-submit" disabled={isSubmitting}>
                                {isSubmitting ? "Salvando..." : "Redefinir senha"}
                            </button>
                        </form>
                    </>
                )}

                <div className="links-adicionais">
                    <a
                        style={{ cursor: "pointer" }}
                        onClick={() => setAbaAtiva("login")}
                    >
                        Voltar ao login
                    </a>
                </div>
            </div>
        </div>
    )
}
