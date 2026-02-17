import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Onboarding.css';

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
        <div className="onboarding">
            <div className="card animate-slideUp onboarding-card">
                <div className="onboarding-icon">
                    {slides[currentSlide].icon}
                </div>

                <h1 className="mb-4">{slides[currentSlide].title}</h1>
                <p className="text-gray mb-8 onboarding-description">
                    {slides[currentSlide].description}
                </p>

                {/* Dots */}
                <div className="onboarding-dots">
                    {slides.map((_, index) => (
                        <div
                            key={index}
                            className={`onboarding-dot ${index === currentSlide ? 'is-active' : ''}`}
                        />
                    ))}
                </div>

                <div className="onboarding-actions">
                    <button onClick={skipOnboarding} className="btn btn-secondary onboarding-action">
                        Saltar
                    </button>
                    <button onClick={nextSlide} className="btn btn-primary onboarding-action onboarding-action--primary">
                        {currentSlide === slides.length - 1 ? 'Comenzar' : 'Siguiente'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Onboarding;
