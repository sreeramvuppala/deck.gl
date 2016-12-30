import {readFileSync} from 'fs';
import {join} from 'path';

export const module = 'lighting';
export const vs = readFileSync(join(__dirname, '/lighting.glsl'), 'utf8');
