import {readFileSync} from 'fs';
import {join} from 'path';

export const module = 'project';
export const vs = readFileSync(join(__dirname, '/project64.glsl'), 'utf8');
