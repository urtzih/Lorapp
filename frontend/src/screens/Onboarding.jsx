import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const slides = [
    {
        icon: '🌱',
        title: 'Gestiona tu huerta',
        description: 'Organiza todas tus semillas en un solo lugar con inventario inteligente'
    },
    {
        icon: '📸',
        title: 'Escanea con IA',
        description: 'Saca una foto del sobre y la app extrae automáticamente toda la información'
    },
    {
        icon: '📅',
        title: 'Calendario automático',
        description: 'Recibe recordatorios personalizados de siembra, trasplante y cosecha'
    }
];

export function Onboarding() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const navigate = useNavigate();

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            navigate('/register');
        }
    };

    const skipOnboarding = () => {
        navigate('/login');
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <div className="card animate-slideUp" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
                <div style={{ fontSize: '5rem', marginBottom: '2rem' }}>
                    {slides[currentSlide].icon}
                </div>

                <h1 className="mb-4">{slides[currentSlide].title}</h1>
                <p className="text-gray mb-8" style={{ fontSize: '1.125rem' }}>
                    {slides[currentSlide].description}
                </p>

                {/* Dots */}
                <div className="flex justify-center gap-2 mb-8">
                    {slides.map((_, index) => (
                        <div
                            key={index}
                            style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: index === currentSlide ? 'var(--color-primary)' : 'var(--color-gray-300)',
                                transition: 'all 0.3s'
                            }}
                        />
                    ))}
                </div>

                <div className="flex gap-4">
                    <button onClick={skipOnboarding} className="btn btn-secondary" style={{ flex: 1 }}>
                        Saltar
                    </button>
                    <button onClick={nextSlide} className="btn btn-primary" style={{ flex: 2 }}>
                        {currentSlide === slides.length - 1 ? 'Comenzar' : 'Siguiente'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Onboarding;
