import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Map, PlusCircle, User, Filter } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './App.css';

interface Vaga {
  id: number;
  titulo: string;
  descricao: string;
  empresa: string;
  tipo: string;
  bairro: string;
  latitude: number;
  longitude: number;
}

export default function App() {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [vagaSelecionada, setVagaSelecionada] = useState<Vaga | null>(null);
  const [abaAtiva, setAbaAtiva] = useState('mapa');
  const [mostrarBoasVindas, setMostrarBoasVindas] = useState(() => {
    return localStorage.getItem('jaVisitou') !== 'sim';
  });

  const [filtrosAtivos, setFiltrosAtivos] = useState<string[]>(['Estágio', 'CLT', 'Jovem Aprendiz', 'Mutirão']);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const timerRef = useRef<number | null>(null);
  const salvadorCentro: [number, number] = [-12.9714, -38.5014];
  const iniciarAplicativo = () => {
    localStorage.setItem('jaVisitou', 'sim');
    setMostrarBoasVindas(false);
  };

  const alternarFiltro = (tipo: string) => {
    if (filtrosAtivos.includes(tipo)) {
      setFiltrosAtivos(filtrosAtivos.filter(t => t !== tipo));
    } else {
      setFiltrosAtivos([...filtrosAtivos, tipo]);
    }
  };

  const buscarVagas = useCallback((lat: number, lon: number) => {
    fetch(`http://localhost:8080/api/vagas?lat=${lat}&lon=${lon}&raio=5000`)
      .then((resposta) => resposta.json())
      .then((dados) => {
        if (dados.erro) {
          setVagas([]);
        } else if (Array.isArray(dados)) {
          setVagas(dados);
        }
      })
      .catch((erro) => console.error("Erro ao buscar vagas:", erro));
  }, []);

  useEffect(() => {
    buscarVagas(salvadorCentro[0], salvadorCentro[1]);
  }, [buscarVagas]);

  const vagasFiltradas = vagas.filter(vaga => filtrosAtivos.includes(vaga.tipo));

  function BuscadorDinamico() {
    useMapEvents({
      moveend: (evento) => {
        const mapa = evento.target;
        const centro = mapa.getCenter();

        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }

        timerRef.current = window.setTimeout(() => {
          console.log("Mapa estabilizou. Buscando vagas para:", centro.lat, centro.lng);
          buscarVagas(centro.lat, centro.lng);
        }, 500);
      },
    });
    return null;
  }

  return (
    <>
      {mostrarBoasVindas && (
        <div className="boas-vindas-overlay">
          <h1>CirculaSSA</h1>
          <p>Encontre oportunidades de emprego, estágios e vagas de jovem aprendiz perto de você com apenas um clique.</p>
          <button className="boas-vindas-btn" onClick={iniciarAplicativo}>
            Explorar Mapa
          </button>
        </div>
      )}

      {abaAtiva === 'mapa' && (
        <>
          <MapContainer center={salvadorCentro} zoom={13} scrollWheelZoom={true} zoomControl={false}>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <BuscadorDinamico />
            
            {vagasFiltradas.map((vaga) => (
              <Marker 
                key={vaga.id} 
                position={[vaga.latitude, vaga.longitude]}
                eventHandlers={{ click: () => setVagaSelecionada(vaga) }}
              />
            ))}
          </MapContainer>

          <button 
            className={`btn-abrir-filtros ${mostrarFiltros ? 'ativo' : ''}`}
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
          >
            <Filter size={20} />
          </button>

          {mostrarFiltros && (
            <div className="painel-filtros">
              <h3>Mostrar oportunidades do tipo:</h3>
              <div className="chips-container">
                {['Estágio', 'CLT', 'Jovem Aprendiz', 'Mutirão'].map(tipo => (
                  <button
                    key={tipo}
                    className={`chip-filtro ${filtrosAtivos.includes(tipo) ? 'ativo' : ''}`}
                    onClick={() => alternarFiltro(tipo)}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {abaAtiva === 'nova-vaga' && (
        <div style={{ padding: '20px', textAlign: 'center', marginTop: '50px' }}>
          <h2>Cadastrar Nova Vaga</h2>
          <p>O formulário entrará aqui!</p>
        </div>
      )}

      {abaAtiva === 'perfil' && (
        <div style={{ padding: '20px', textAlign: 'center', marginTop: '50px' }}>
          <h2>Meu Perfil</h2>
          <p>Configurações e vagas salvas entrarão aqui.</p>
        </div>
      )}

      {vagaSelecionada && abaAtiva === 'mapa' && (
        <>
          <div className="overlay" onClick={() => setVagaSelecionada(null)}></div>
          <div className="bottom-sheet">
            <button className="botao-fechar" onClick={() => setVagaSelecionada(null)}>&times;</button>
            <h2>{vagaSelecionada.titulo}</h2>
            <span className="tag-tipo">{vagaSelecionada.tipo}</span>
            <p className="info-empresa">
              <strong>Empresa:</strong> {vagaSelecionada.empresa} &bull; <strong>Local:</strong> {vagaSelecionada.bairro}
            </p>
            <p className="descricao-vaga">{vagaSelecionada.descricao}</p>
          </div>
        </>
      )}

      <nav className="bottom-nav">
        <button 
          className={`nav-item ${abaAtiva === 'mapa' ? 'ativo' : ''}`}
          onClick={() => {
            setAbaAtiva('mapa');
            setMostrarBoasVindas(false);
          }}
        >
          <Map size={22} />
          Mapa
        </button>
        
        <button 
          className={`nav-item ${abaAtiva === 'nova-vaga' ? 'ativo' : ''}`}
          onClick={() => {
            setAbaAtiva('nova-vaga');
            setVagaSelecionada(null);
            setMostrarFiltros(false);
          }}
        >
          <PlusCircle size={22} />
          Nova Vaga
        </button>

        <button 
          className={`nav-item ${abaAtiva === 'perfil' ? 'ativo' : ''}`}
          onClick={() => {
            setAbaAtiva('perfil');
            setVagaSelecionada(null);
            setMostrarFiltros(false);
          }}
        >
          <User size={22} />
          Perfil
        </button>
      </nav>
    </>
  );
}