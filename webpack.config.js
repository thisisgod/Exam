const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals')

module.exports = {
    entry: './init.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/dist/',
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                include: path.join(__dirname),
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: ['@babel/plugin-proposal-class-properties']
                    }
                }
            }
        ]
    },
    devtool: 'source-map',
    mode: 'development',
    node : {
        fs : 'empty',
        net : 'empty',
        tls : 'empty'
    },
    externals: [nodeExternals()],
};