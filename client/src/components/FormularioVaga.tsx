import React, { useEffect, useState } from 'react'
import { CheckCircle, MapPin, Send } from 'lucide-react'
import { Vaga } from '../App';
import toast from 'react-hot-toast';
import { fetchAuth } from '../utils/api';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rua, setRua] = useState('');
    const [numero, setNumero] = useState('');
    const [buscandoEndereco, setBuscandoEndereco]=useState(false);

    const[localizacao, setLocalizacao] = useState<{lat: number, lon: number} | null>(null)

    const buscarCoordenadasPorEndereco = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!rua || !bairro){
            toast.error("Preencha a Rua e o Bairro para buscar no mapa.");
            return;
        }

        setBuscandoEndereco(true);
        try{

            let query = numero
                ? encodeURIComponent(`${rua}, ${numero}, ${bairro}, Salvador, Bahia, Brasil`)
                : encodeURIComponent(`${rua}, ${bairro}, Salvador, Bahia, Brasil`);


            let response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`)
            let data = await response.json();

            if ((!data || data.length === 0) && numero){
                console.log("Numero ao mapeado na OSM, buscando localizacao geral");
                query = encodeURIComponent(`${rua}, ${bairro}, Salvador, Bahia, Brasil`);
                response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
                data = await response.json();
            }

            if(data && data.length > 0){
                setLocalizacao({
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon)
                });
                toast.success("Localização encontrada com sucesso no mapa!");
            }else{
                toast.error("Endereço não encontrado. Verifique a ortografia da rua e do bairro.")
            }
        }catch(error){
            console.error("Erro na busca de endereço:", error);
            toast.error("Falha ao buscar o endereço.");
        }
        setBuscandoEndereco(false);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if(!localizacao){
            toast.error("Por favor, capture a localizacao da vaga primeiro!");
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
        toast.success("Vaga registrada com sucesso!");
        
        const token = localStorage.getItem('token')

        setIsSubmitting(true);

        try{
            const API_URL = import.meta.env.VITE_API_URL;
            const response = await fetchAuth(`${API_URL}/api/vaga`, {
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
                toast.error("Erro ao enviar a vaga para o servidor.")
            }
        } catch(error){
            console.error("Erro na requisicao: ", error);
            toast.error("Não foi possível conectar ao servidor.");
        }
        setIsSubmitting(false);  
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
                    <label>Rua</label>
                    <input type='text' placeholder='Ex: Rua A' value={rua} onChange={(e) => setRua(e.target.value)} required/>
                </div>

                <div className='grupo-input'>
                    <label>Número (Opcional)</label>
                    <input type='text' placeholder='Ex: 144' value={numero} onChange={(e) => setNumero(e.target.value)} />
                </div>

                <div className='grupo-input'>
                    <label>Descrição e Requisitos</label>
                    <textarea rows={4} placeholder='O que o candidator precisa saber?' value={descricao} onChange={(e)=> setDescricao(e.target.value)} required/>
                </div>

                <div className='cartao-gps'>
                    <h3>Localização no Mapa</h3>
                    <p>Informe o endereço exato para cravarmos o pino no mapa em uma localização geral.(otilizar o "Usar meu GPS Atual" é mais preciso. Lembre-se de digitar o bairro)</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginBottom: '12px' }}>
                        <button 
                            onClick={buscarCoordenadasPorEndereco}
                            style={{ padding: '12px 20px', borderRadius: '10px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                            disabled={buscandoEndereco}
                        >
                            {buscandoEndereco ? "Buscando..." : "Buscar Endereço no Mapa"}
                        </button>
                    </div>

                    <div style={{ height: '250px', width: '100%', marginTop: '20px', borderRadius: '10px', overflow: 'hidden', border: '2px solid #e2e8f0' }}>
                        <MapContainer 
                            center={localizacao ? [localizacao.lat, localizacao.lon] : [-12.9714, -38.5014]}
                            zoom={13} 
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer 
                                attribution='<a href="https://carto.com/attributions">CARTO</a>'
                                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            />
                            {localizacao && (
                                <>
                                    <Marker
                                        position={[localizacao.lat, localizacao.lon]}
                                        draggable={true}
                                        eventHandlers={{
                                            dragend: (e) => {
                                                const marker = e.target;
                                                const position = marker.getLatLng();
                                                setLocalizacao({ lat: position.lat, lon: position.lng });
                                                toast.success("Pino ajustado manualmente com sucesso!");
                                            }
                                        }}
                                    />
                                    <RecenterMap lat={localizacao.lat} lon={localizacao.lon} />
                                </>
                            )}
                        </MapContainer>
                    </div>
                    {localizacao && (
                        <p style={{ fontSize: '0.85rem', color: '#ef4444', textAlign: 'center', marginTop: '10px', fontWeight: 'bold' }}>
                            O pino está no lugar errado? Arraste-o com o dedo/mouse para o local exato da vaga!
                        </p>
                    )}

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
                        <Send size={20} /> {isSubmitting ? "Enviando..." : "Anunciar Vaga"}
                    </button>
            </form>
        </div>
    );
}

function RecenterMap({lat, lon}: {lat: number, lon: number}){
    const map = useMap();
    useEffect(()=>{
        map.flyTo([lat, lon], 17);
    }, [lat, lon, map]);
    return null;
}