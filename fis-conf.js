/**
 *  测试版本的 fisp + webpack,代码乱。
 */

/* global fis */
/* global __dirname */

// webpack 相关配置
var webpack = require('webpack');
var commonsPlugin = new webpack.optimize.CommonsChunkPlugin('common.js');
var glob = require('glob');
var path = require('path');


// fisp 基础配置
fis.config.merge({
    namespace: 'fisPack',
    project: {
        charset: 'gbk'
    },
    settings: {
        smarty: {
            left_delimiter: '<%',
            right_delimiter: '%>'
        }
    }
});

// 本地部署
fis.config.set('deploy', {
    local: {
        to: '../output'
    }
});

/**
 * webpack相关文件不release
 * static及widget文件夹下不使用自动模块化包裹
 */
fis.config.set('roadmap.path', [
    {
        reg: 'package.json',
        release: false
    },
    {
        reg: /^\/node_modules\/(.*)/i,
        release: false
    },
    {
        reg: /^\/static\/(.*)/i,
        isMod: false
    },
    {
        reg: /^\/widget\/.*js$/i,
        isMod: false,
        release: '${statics}/${namespace}/$&'
    }
].concat(fis.config.get('roadmap.path', [])));

var modulesDir = './widget/modules/';

// 自动分析entry
var entry = function () {
    var result = {};

    glob.sync(
        modulesDir + '*'
    ).forEach(function (name) {
            // TODO: 支持linux、达尔文
            var dirs = name.match(/[^/]+/g);
            var n = dirs[dirs.length - 1];
            result[n] = modulesDir + n + '/' + n + '.js';
        });

    return result;
};

// webpack配置
var webpackConfig = {
    entry: entry(),
    output: {
        path: './static/',
        filename: './[name].js'
    },
    resolve: {
        extensions: ['', '.js', '.css']
    },
    module: {
        loaders: [
            {test: /\.css$/, loader: 'style-loader!css-loader'},
            {test: /\.(png|jpg|gif)$/, loader: 'url-loader?limit=8192'}
        ]
    },
    plugins: [commonsPlugin]
};

// 编译器
var compiler = webpack(webpackConfig);

// 是否需要 监听文件修改（watch） ps：找的好痛苦。。。
var argv = fis.cli.commander.args[0];

/**
 * 这里的逻辑是，从fisp的参数里把第一个参数拿出来，参数选项中watch存在则相应启动webpack的watch;
 * 细想也挺靠谱的，fisp只有 init、release、server、install几个一级命令。
 */
((argv._name === 'release') && (argv.watch))
    ? compiler.watch({}, compilerCallBack) : compiler.run(compilerCallBack);

var colorsFunc = fis.cli.colors;

function compilerCallBack(err, stats) {
    // TODO: 通过status打印编译日志.
    // 基础打印
    if (err) {
        return console.log(
            colorsFunc.red('错误！')
        )
    }

    var jsonStats = stats.toJson();

    if (jsonStats.errors.length > 0) {
        return jsonStats.errors.forEach(function (msg) {
            console.log(
                colorsFunc.red(msg + '\n')
            );
        });
    }

    if (jsonStats.warnings.length > 0) {
        jsonStats.warnings.forEach(function (msg) {
            console.log(
                colorsFunc.yellow(msg + '\n')
            )
        });
    }


}

