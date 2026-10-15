import {env} from 'cloudflare:workers';
export function database(){if(!env.DB)throw new Error('Catalogue unavailable');return env.DB;}
