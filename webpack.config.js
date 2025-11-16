const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    devServer: {
        static: {
            directory: path.resolve(__dirname, 'public')
        },
        compress: true,
        port: 3000,
        allowedHosts: 'all',
        client: {
            webSocketURL: 'wss://1804633.fl.gridesk.ru/ws',
            overlay: false,
        },
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    },
    context: path.resolve(__dirname),
    devtool: 'inline-source-map',
    entry: {
        // Основной бандл с core функциональностью
        "core": "./src/entries/core.ts",
        "core.min": "./src/entries/core.ts",
        // Отдельный бандл для Editor
        "editor": "./src/entries/editor.ts",
        "editor.min": "./src/entries/editor.ts",
        // Отдельный бандл для Popup
        "popup": "./src/entries/popup.ts",
        "popup.min": "./src/entries/popup.ts",
        // Отдельный бандл для CardForm
        "cardForm": "./src/entries/cardForm.ts",
        "cardForm.min": "./src/entries/cardForm.ts",
    },
    mode: 'development',
    module: {
        rules: [{
            test: /\.ts?$/,
            use: 'ts-loader',
            exclude: /node_modules/
        }]
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        library: {
            name: '[name]',
            type: 'umd',
        },
        globalObject: 'this',
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    optimization: {
        minimize: true,
        minimizer: [new UglifyJsPlugin({
            include: /\.min\.js$/
        })],
        // Отключаем разделение кода, т.к. это вызывает проблемы с UMD
        splitChunks: false,
    }
};
