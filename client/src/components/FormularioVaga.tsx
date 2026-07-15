import { useState } from 'react'
import { CheckCircle, MapPin, Send } from 'lucide-react'
import { Vaga } from '../App';


interface FormularioVagaProps{
    adicionarVagaNaLista: (vaga: Vaga) => void;
    setAbaAtiva: (aba: string) => void;
}


export default function FormularioVaga({ adicionarVagaNaLista, setAbaAtiva }: FormularioVagaProps){
    
    const [titulo, setTitulo] = useState('');
    const [empresa, setEmpresa] = useState('');
    const [descricao, setDescricao] = useState('');
    const [tipo, setTipo] = useState('CLT');
    const [bairro, setBairro] = useState('');
    const [linkContato, setLinkContato] = useState('');

    const[localizacao, setLocalizacao] = useState<{lat: number, lon: number} | null>(null)
    const [buscandoGps, setBuscandoGps] = useState(false);

    const capturarLocalizacao = (e: React.MouseEvent) => {
        e.preventDefault();
        setBuscandoGps(true);


        if("geolocation" in navigator){
            navigator.geolocation.getCurrentPosition(
                (posicao) => {
                    setLocalizacao({
                        lat: posicao.coords.latitude,
                        lon: posicao.coords.longitude
                    });
                    setBuscandoGps(false)
                },
                (erro) => {
                    console.error("Erro no GPS:", erro);
                    alert("Não conseguimos acessar sua localização. Verifique as permissões do navegador.");
                    setBuscandoGps(false);
                }
            );
        }else{
            alert("Seu navegador não suporta GPS.")
            setBuscandoGps(false)
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if(!localizacao){
            alert("Por favor, capture a localizacao da vaga primeiro!");
            return;
        }

        const dadosVagas = {
            titulo,
            empresa,
            descricao,
            tipo,
            bairro,
            latitude: localizacao.lat,
            longitude: localizacao.lon,
            link_contato: linkContato
        };

        console.log("Vaga pronta para ir no backend:", dadosVagas)
        alert("Vaga registrada com sucesso!");
        
        const token = localStorage.getItem('token')

        try{
            const response = await fetch("http://localhost:8080/api/vaga", {
                method: "POST",
                headers: {
                    "Content-Type":  "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(dadosVagas),
            });

            if (response.ok){
                const novaVagaDoServidor = await response.json();
                adicionarVagaNaLista(novaVagaDoServidor);
                setAbaAtiva('painel-empresa');
            }else{
                alert("Erro ao enviar a vaga para o servidor.")
            }
        } catch(error){
            console.error("Erro na requisicao: ", error);
            alert("Não foi possível conectar ao servidor.");
        }
        
    };
    return(
        <div className='container-formulario'>
            <h2>Cadastrar Nova Vaga</h2>
            <p className='subtitulo'>Preencha os dados para a oportunidade</p>

            <form onSubmit={handleSubmit} className='form-vaga'>
                <div className='grupo-input'>
                    <label>Título da Vaga</label>
                    <input type='text' placeholder='Ex: Desenvolvedor Front-End' value={titulo} onChange={(e) => setTitulo(e.target.value)} required/>
                </div>

                <div className='grupo-input'>
                    <label>Nome da Empresa</label>
                    <input type='text' placeholder='Ex: Tech Solutions' value={empresa} onChange={(e) => setEmpresa(e.target.value)}  required/>
                </div>

                <div className='grupo-input'>
                    <label>Tipo de Contrato</label>
                    <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                        <option value="CLT">CLT</option>
                        <option value="Estágio">Estágio</option>
                        <option value="Jovem Aprendiz">Jovem Aprendiz</option>
                        <option value="Mutirão">Mutirão</option>
                    </select>
                </div>

                <div className='grupo-input'>
                    <label>Bairro (Sede ou Local de Trabalho)</label>
                    <input type='text' placeholder='Ex: Caminho das Árvores' value={bairro} onChange={(e) => setBairro(e.target.value)} required/>
                </div>

                <div className='grupo-input'>
                    <label>Descrição e Requisitos</label>
                    <textarea rows={4} placeholder='O que o candidator precisa saber?' value={descricao} onChange={(e)=> setDescricao(e.target.value)} required/>
                </div>

                <div className='cartao-gps'>
                    <h3>Localização no Mapa</h3>
                    <p>Precisamos da localização exata para exibir o pino no mapa da cidade.</p>
                    <button 
                        className={`btn-gps ${localizacao ? 'sucesso' : ''}`}
                        onClick={capturarLocalizacao}
                    >
                        {buscandoGps ? (
                            "Buscando satélites..."
                        ) : localizacao ? (
                            <><CheckCircle size={20}/>Localização Salva</>
                        ) : (
                            <><MapPin size={20}/> Capturar Posição Atual</>
                        )}
                    </button>
                </div>

                <div className="grupo-input">
                    <label>Link ou E-mail para Contato</label>
                    <input 
                        type="text" 
                        placeholder="ex: https://gupy.io/... ou rh@suaempresa.com" 
                        value={linkContato} 
                        onChange={(e) => setLinkContato(e.target.value)} 
                        required 
                    />
                </div>

                    <button type='submit' className='btn-submit'>
                        <Send size={20} /> Anunciar Vaga
                    </button>
            </form>
        </div>
    );
}