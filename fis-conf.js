/**
 *  fisp + webpack
 */

/* global fis */
/* global __dirname */

// webpack �������
var webpack = require('webpack');

// plugins
var commonsPlugin = new webpack.optimize.CommonsChunkPlugin('common.js');

// ���������Ҫ������css�ļ���ȡ����������ʹ�øò��
// var ExtractTextPlugin = require("extract-text-webpack-plugin");

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
        reg: /^\/node_modules\/(.*)/i,
        release: false
    }
    , {
        reg: /^\/static\/(.*)/i,
        isMod: false
    }
    , {
        reg: /^\/widget\/.*js$/i,
        isMod: false,
        release: '${statics}/${namespace}/$&'
    }
].concat(fis.config.get('roadmap.path', [])));


var dirResolver = function (pathPartPattern) {
    var result = {};

    // ������·��
    var $paths = glob.sync(pathPartPattern);

    var args = arguments;

    if (!$paths.length) {
        return null;
    }

    $paths.forEach(
        function (name) {

            var childPath = args.callee(
                [name, '*'].join(path.sep)
            );

            var dirs = name.match(/[^/]+/g);
            var n = dirs[dirs.length - 1];

            result[n] = childPath ? childPath : 0;
        }
    );

    return result;
};

// �õ�һ���ļ�Ŀ¼����
var modulesMap = dirResolver('./widget/*');

// ģ����·��
var modulesDir = './widget/modules/';

// �Զ�����entry
var entry = function (data) {

    var result = {};

    for (var key in data) {
        if (key === 'modules') {
            result = arguments.callee(data[key]);
            break;
        } else {
            result[key] = modulesDir + key + '/' + key + '.js';
        }
    }

    return result;

};

console.log(entry(modulesMap));

/**
 * �Զ���������
 *
 * Ԥ��Ϊ�����磩��
 *
 *      widget �ļ�������δ֪Ŀ¼�ṹ���������Ϊ ��������Ŀ¼:ģ��������
 *
 *      e.g.
 *
 *          widget
 *              - components
 *                      - dialog
 *                      - validator
 *              - modules
 *                      - profile
 *                      - feed
 *              - someDir
 *                      - someModule1
 *                      - someModule2
 *
 *      require( 'components:dialog' ) // eq require( './components/dialog/dialog' );
 *      require( 'modules:feed' )      // eq require( './modules/feed/feed' );
 *      require( 'someDir:someModule2' )  // eq require( './someDir/someModule2/someModule2' );
 *
 *  ���ܿ�����ûʲô���𣬵��ǵ�����ʵ��Ӧ���У��ڲ�ͬĿ¼���ļ���require�ͻ᷽��ܶࡣ
 *
 *
 * TODO���϶����Ż��ռ䡣
 *
 *
 * @param data
 */
var alias = function (data, traditional) {
    var result = {};

    for (var key in data) {
        if (traditional) {

        } else {

        }
    }

    return result;
};

// webpack����
var webpackConfig = {

    // ����Ŀ¼������·������������ entry��
    context: __dirname

    // ����ļ�����Ӧ�����ɰ��������Զ�����/widget/modules�ļ����µ��������ļ�����������������
    , entry: entry(modulesMap)

    // �������
    , output: {
        path: './static/'                 // �����·��
        // , publicPath: ''               // http://webpack.github.io/docs/configuration.html#output-publicpath
        , filename: './[name].js'         // ����������,���·��
        , sourceMapFilename: '[name].map' // ���map�ļ�
        , jsonpFunction: 'fisPackJsonp'   // ��Ӧ���webpackʵ�������л����У������޸�ΪfisPackJsonp
        , chunkFilename: "[id].js"
    }

    /**
     * ��׺�����ݣ�������ģ��
     *
     * e.g
     *
     *      һ��ģ���ǣ�feed/feed.js
     *      ��ô���ᰴ�� extensions �ṩ��˳��ȥ���ң�
     *
     *      feed/feed.js
     *      feed/feed.js.js
     *      feed/feed.js.es6
     *      feed/feed.js.css
     *      ..etc..
     *
     *      ������������ģ�������ȥ��׺������webpack�Լ���ȫ.
     *
     *
     */
    , resolve: {
        root: __dirname
        , extensions: [
            ''
            , '.js'
            , '.es6'
            , '.css'
            , '.less'
            , '.sass'
            , '.scss'
            , '.coffee'
        ]
        , alias: alias(modulesMap)
    }

    /**
     *
     * ָ��һ���Զ�ִ�е�loader����
     * http://webpack.github.io/docs/configuration.html#module-loaders
     * PS: ̾�š������������Ϊ to �� pipe
     *
     * webpack�����ݿ�����ɱ�֣�
     *
     *  IMPORTANT:
     *      The loaders here are resolved relative to the resource which they are applied to.
     *      This means they are not resolved relative the the configuration file.
     *      If you have loaders installed from npm and your node_modules folder is not in a parent folder of all source files,
     *      webpack cannot find the loader.
     *      You need to add the node_modules folder as absolute path to the resolveLoader.root option.
     *      (resolveLoader: { root: path.join(__dirname, "node_modules") })
     *
     * ����root�����ã���������¿�
     *
     *
     */
    , module: {
        loaders: [

            // css�ļ�loader
            {
                test: /\.css$/
                , loader: 'style-loader!css-loader?minimize'
            }

            // �����ͼƬ�ļ����أ�����staticĿ¼�£�����һ����ӦĿ¼��ͼƬ�ļ������
            , {
                test: /\.(jpe?g|png|gif|svg)$/i
                , loaders: [
                    'file?name=[path][name].[ext]',
                    'image-webpack?bypassOnDebug'
                ]
            }

            // Extract css files
            // , {
            //    test: /\.css$/,
            //    loader: ExtractTextPlugin.extract("style-loader", "css-loader")
            // }

            // Optionally extract less files
            // or any other compile-to-css language
            // , {
            //    test: /\.less$/,
            //    loader: ExtractTextPlugin.extract("style-loader", "css-loader!less-loader")
            // }

            // You could also use other loaders the same way. I. e. the autoprefixer-loader
        ]
    }

    //
    , plugins: [
        commonsPlugin
        // , new ExtractTextPlugin("[name].css")
    ]

    //
    , debug: true

    /**
     * �⣡�һ������Ҫ������
     *
     * �����ճ�������������ݿ��������Ǵ�svn����֧��co��ĳ��Ŀ¼��
     * �����ʹ��webpack����ô����loader�ǲ��ܰ�װ��ȫ�ֵģ�
     * ���������ֲ���ÿ�������֧��Ҫȥ��װһ��loader��
     *
     * ���ԣ�������������resolveLoader�� root��
     * �����webpack���̵���һ��Ŀ¼��
     * ��������ֻҪ����һ��loader��node_modules����ʵ�ָ��á�
     *
     * ��Ҳ��û�а취���£������������ֵ�õģ����Ͱɣ�ɧ�ꡣ
     *
     * loader��ͳһ����� ��һ��Ŀ¼�� node_modules �ļ�����
     */
    , resolveLoader: {
        root: path.resolve(__dirname, '../node_modules/')
    }
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
    ? compiler.watch({}, compilerCallBack)
    : compiler.run(compilerCallBack);

var colorsFunc = fis.cli.colors;

function compilerCallBack(err, stats) {

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

    console.log(jsonStats.reasons, '\n NEXT: \n', jsonStats.chunks);

    jsonStats.chunks.forEach(function (data) {
        console.log(
            colorsFunc.green(
                [
                    'Output: '
                    , data.files
                    , ' Size: '
                    , data.size
                    , 'b'
                ].join('')
            )
        )
    });


}