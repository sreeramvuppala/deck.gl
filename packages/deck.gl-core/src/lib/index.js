// Set up deck.gl global state
import './init';

// Export core objects
export {default as Layer} from './layer';
export {default as AttributeManager} from './attribute-manager';
export {default as LayerManager} from './layer-manager';
export {COORDINATE_SYSTEM} from './webgl-viewport';

// Object iteration helper
export * from './utils/object-iterator';
