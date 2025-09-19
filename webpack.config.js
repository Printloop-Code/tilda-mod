const path = require('path');

module.exports = {
    devServer: {
        static: {
            directory: path.resolve(__dirname, 'public')
        },
        compress: true,
        port: 3000,
        allowedHosts: 'all',
    },
    context: path.resolve(__dirname),
    devtool: 'inline-source-map',
    entry: "./src/index.ts",
    mode: 'development',
    module: {
        rules: [{
            test: /\.ts?$/,
            use: 'ts-loader',
            exclude: /node_modules/
        }]
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
};
