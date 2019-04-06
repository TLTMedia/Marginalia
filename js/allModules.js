import {hello, APIHandler} from './APIHandler.js';

hello();

let x = new APIHandler();
x.say();
x.request();

export {hello, APIHandler} from './APIHandler.js';
