/**
 * Initialization of Marginalia scripts begin here
 */
import {APIHandler} from './ModuleLoader.js';

$(function() {
    var xyz = new APIHandler();
    console.log(xyz);
    TEST();
});

function TEST() {
    console.log('test');
}