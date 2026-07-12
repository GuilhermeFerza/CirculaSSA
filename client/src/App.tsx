import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Map, PlusCircle, User, Filter, PersonStanding } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './App.css';
import MenuInferior from './components/MenuInferior';
import Onboarding from './components/onBoarding';

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
  const [perfilUsuario, setPerfilUsuario] = useState(()=>{
    return localStorage.getItem('perfilUsuario') || '';
  });

  const [filtrosAtivos, setFiltrosAtivos] = useState<string[]>(['Estágio', 'CLT', 'Jovem Aprendiz', 'Mutirão']);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarBairro, setMostrarBairro] = useState<string>('');
  const timerRef = useRef<number | null>(null);
  const salvadorCentro: [number, number] = [-12.9714, -38.5014];


  const sairDoPerfil = () => {
    localStorage.removeItem('perfilUsuario');
    setPerfilUsuario('');
    setAbaAtiva('mapa');
  }

  const alternarFiltro = (tipo: string) => {
    if (filtrosAtivos.includes(tipo)) {
      setFiltrosAtivos(filtrosAtivos.filter(t => t !== tipo));
    } else {
      setFiltrosAtivos([...filtrosAtivos, tipo]);
    }
  };

  const bairrosDisponiveis = Array.from(new Set(vagas.map(v => v.bairro))).filter(Boolean).sort();

  const vagasFiltradas = vagas.filter(vaga => {
    const passaFiltroTipo = filtrosAtivos.includes(vaga.tipo);
    const passaFiltroBairro = mostrarBairro === '' || vaga.bairro === mostrarBairro;
    return passaFiltroTipo && passaFiltroBairro;
  });


  const buscarVagas = useCallback((lat: number, lon: number, raio: number) => {
    fetch(`http://localhost:8080/api/vaga?lat=${lat}&lon=${lon}&raio=${raio}`)
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
    buscarVagas(salvadorCentro[0], salvadorCentro[1], 5000);
  }, [buscarVagas]);


  function BuscadorDinamico() {
    useMapEvents({
      moveend: (evento) => {
        const mapa = evento.target;
        const centro = mapa.getCenter();
        const zoom = mapa.getZoom();

        let raioDinamico = 5000

        if(zoom >= 16){
            raioDinamico = 2000;
        } else if (zoom >= 14) {
          raioDinamico = 5000;
        } else if (zoom >= 12) {
          raioDinamico = 15000;
        } else {
          raioDinamico = 30000;
        }

        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }

        timerRef.current = window.setTimeout(() => {
          console.log("Mapa estabilizou. Buscando vagas para:", centro.lat, centro.lng);
          buscarVagas(centro.lat, centro.lng, raioDinamico);
        }, 500);
      },
    });
    return null;
  }

  return (
    <>
     

      
    <Onboarding 
      perfilUsuario={perfilUsuario}
      setPerfilUsuario={setPerfilUsuario}
      setAbaAtiva={setAbaAtiva}
    />

      {abaAtiva === 'mapa' && (
        <>
          <MapContainer center={salvadorCentro} zoom={13} scrollWheelZoom={true} zoomControl={false}>
            <TileLayer
              attribution='<a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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
              {bairrosDisponiveis.length > 0 && (
                <div style={{ marginTop: '20px'}}>
                  <h3>Filtrar por Bairro</h3>
                  <select
                    className='select-bairro'
                    value={mostrarBairro}
                    onChange={(e)=> setMostrarBairro(e.target.value)}
                  >
                    <option value="">Todos os Bairros</option>
                    {bairrosDisponiveis.map(bairro => (
                      <option key={bairro} value={bairro}>
                        {bairro}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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

      {abaAtiva === 'painel-empresa' && (
        <div style={{ padding: '20px', textAlign: 'center', marginTop: '50px' }}>
          <h2>Minhas Vagas Anunciadas</h2>
          <p>O dashboard da empresa entrará aqui.</p>
        </div>
      )}


      {abaAtiva === 'perfil' && (
        <div className="container-perfil">
          <h2>Meu Perfil</h2>
          <div className="card-info-perfil">
            <div className="avatar-placeholder">
              <User size={40} color="#94a3b8" />
            </div>
            <p>Mode de Navegação atual</p>
            <span className='badge-perfil'>
              {perfilUsuario === 'candidato' ? 'buscando vagas' : 'empresa'}
            </span>
          </div>
          <button className='btn-sair' onClick={sairDoPerfil}>
            Sair / Trocar de Perfil
          </button>
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

      <MenuInferior
        perfilUsuario={perfilUsuario}
        abaAtiva={abaAtiva}
        setAbaAtiva={setAbaAtiva}
        setMostrarFiltros={setMostrarFiltros}
      />
    </>
  );
}




/*
src/
 ├── components/
 │    ├── Onboarding.tsx        (A tela azul de perfil)
 │    ├── MenuInferior.tsx      (A barra de navegação inteligente)
 │    ├── Filtros.tsx           (A gaveta com os botões de estágio/bairro)
 │    ├── MapaPrincipal.tsx     (O Leaflet e os marcadores)
 │    └── FormularioVaga.tsx    (O input de cadastro da empresa)
 │
 ├── App.css                    (Pode ser quebrado em módulos CSS depois)
 └── App.tsx                    (Vira apenas o "maestro" que junta as peças)
*/