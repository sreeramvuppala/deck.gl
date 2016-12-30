import {readFileSync} from 'fs';
import {join} from 'path';

export const module = 'fp64';
export const vs = readFileSync(join(__dirname, '/picking.vertex.glsl'), 'utf8');
export const fs = readFileSync(join(__dirname, '/picking.fragment.glsl'), 'utf8');
