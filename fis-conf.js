/**
 *  ���԰汾�� fisp + webpack,�����ҡ�
 */

/* global fis */
/* global __dirname */

// webpack �������
var webpack = require('webpack');
var commonsPlugin = new webpack.optimize.CommonsChunkPlugin('common.js');
var glob = require('glob');
var path = require('path');


// fisp ��������
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

// ���ز���
fis.config.set('deploy', {
    local: {
        to: '../output'
    }
});

/**
 * webpack����ļ���release
 * static��widget�ļ����²�ʹ���Զ�ģ�黯����
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

// �Զ�����entry
var entry = function () {
    var result = {};

    glob.sync(
        modulesDir + '*'
    ).forEach(function (name) {
            // TODO: ֧��linux�������
            var dirs = name.match(/[^/]+/g);
            var n = dirs[dirs.length - 1];
            result[n] = modulesDir + n + '/' + n + '.js';
        });

    return result;
};

// webpack����
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

// ������
var compiler = webpack(webpackConfig);

// �Ƿ���Ҫ �����ļ��޸ģ�watch�� ps���ҵĺ�ʹ�ࡣ����
var argv = fis.cli.commander.args[0];

/**
 * ������߼��ǣ���fisp�Ĳ�����ѵ�һ�������ó���������ѡ����watch��������Ӧ����webpack��watch;
 * ϸ��Ҳͦ���׵ģ�fispֻ�� init��release��server��install����һ�����
 */
((argv._name === 'release') && (argv.watch))
    ? compiler.watch({}, compilerCallBack) : compiler.run(compilerCallBack);

var colorsFunc = fis.cli.colors;

function compilerCallBack(err, stats) {
    // TODO: ͨ��status��ӡ������־.
    // ������ӡ
    if (err) {
        return console.log(
            colorsFunc.red('����')
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

