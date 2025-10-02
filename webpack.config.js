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
        "bundle": "./src/index.ts",
        "bundle.min": "./src/index.ts",
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
        path: path.resolve(__dirname, 'dist')
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    optimization: {
        minimize: true,
        minimizer: [new UglifyJsPlugin({
            include: /\.min\.js$/
        })]
    }
};
