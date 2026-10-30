/**
 * PortfolioSections.js
 * Controlador de interactividad semántica y microinteracciones de las 6 secciones
 * de la Single Page:
 * - Filtros de los 23 Productos y Sistemas en Producción
 * - Filtros de los 8 Casos de Éxito y Trayectoria FDE
 * - Selector de los 8 Marcos Metodológicos + 5 Etapas FDE
 * - Simulador de Flujo Tradicional vs. Workflow Aumentado por IA (Roles Aumentados)
 * - Asistente Conversacional FDE y utilidades de portapapeles
 */
export class PortfolioSections {
    static init() {
        // Inicializar contadores animados de KPIs con GSAP ScrollTrigger
        if (window.gsap && window.ScrollTrigger) {
            gsap.registerPlugin(ScrollTrigger);

            document.querySelectorAll('.kpi-counter').forEach((counter) => {
                const target = parseFloat(counter.getAttribute('data-target') || '0');
                const decimals = parseInt(counter.getAttribute('data-decimals') || '0', 10);
                const obj = { val: 0 };

                ScrollTrigger.create({
                    trigger: counter,
                    start: 'top 90%',
                    once: true,
                    onEnter: () => {
                        gsap.to(obj, {
                            val: target,
                            duration: 2.0,
                            ease: 'power2.out',
                            onUpdate: () => {
                                counter.textContent = obj.val.toFixed(decimals);
                            }
                        });
                    }
                });
            });

            // Animación de entrada suave para bloques narrativos
            document.querySelectorAll('.narrative-reveal').forEach((el) => {
                gsap.fromTo(
                    el,
                    { opacity: 0, y: 28 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.75,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: el,
                            start: 'top 86%',
                            toggleActions: 'play none none reverse'
                        }
                    }
                );
            });
        }
    }
}
