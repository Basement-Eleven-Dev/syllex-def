export const environment = {
  production: false,
};

const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
// Se siamo su localhost usa localhost, altrimenti usa l'IP locale (es. 192.168.x.x) per permettere ai dispositivi sulla stessa rete di connettersi al backend
export const apiUrl = (hostname === 'localhost' || hostname === '127.0.0.1' )
  ? 'http://localhost:3000'
  : `http://${hostname}:3000`;

export const logRocketId = 'r2d4zg/syllex'
export const isStaging = true;