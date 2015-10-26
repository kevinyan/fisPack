/**
 *  fisp + webpack
 */

/* global fis */
/* global __dirname */

// webpack 相关配置
var webpack = require('webpack');

// plugins
var commonsPlugin = new webpack.optimize.CommonsChunkPlugin('common.js');

// 如果有需求要将所有css文件提取出来，可以使用该插件
// var ExtractTextPlugin = require("extract-text-webpack-plugin");

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

    // 分析出路径
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

// 得到一颗文件目录的树
var modulesMap = dirResolver('./widget/*');

// 模块存放路径
var modulesDir = './widget/modules/';

// 自动分析entry
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
 * 自动分析别名
 *
 * 预期为（例如）：
 *
 *      widget 文件夹下有未知目录结构，将会分析为 “相邻子目录:模块名”，
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
 *  可能看起来没什么区别，但是当我们实际应用中，在不同目录的文件里require就会方便很多。
 *
 *
 * TODO：肯定有优化空间。
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

// webpack配置
var webpackConfig = {

    // 基本目录（绝对路径）用来分析 entry。
    context: __dirname

    // 入口文件及对应的生成包，这里自动分析/widget/modules文件夹下的相邻子文件夹名，当作包名。
    , entry: entry(modulesMap)

    // 输出配置
    , output: {
        path: './static/'                 // 输出的路径
        // , publicPath: ''               // http://webpack.github.io/docs/configuration.html#output-publicpath
        , filename: './[name].js'         // 出处包名称,相对路径
        , sourceMapFilename: '[name].map' // 输出map文件
        , jsonpFunction: 'fisPackJsonp'   // 对应多个webpack实例在运行环境中，这里修改为fisPackJsonp
        , chunkFilename: "[id].js"
    }

    /**
     * 后缀名数据，来分析模块
     *
     * e.g
     *
     *      一个模块是：feed/feed.js
     *      那么他会按照 extensions 提供的顺序去查找：
     *
     *      feed/feed.js
     *      feed/feed.js.js
     *      feed/feed.js.es6
     *      feed/feed.js.css
     *      ..etc..
     *
     *      所以我们引用模块可以舍去后缀，交给webpack自己补全.
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
     * 指定一个自动执行的loader数组
     * http://webpack.github.io/docs/configuration.html#module-loaders
     * PS: 叹号“！”可以理解为 to 或 pipe
     *
     * webpack对敏捷开发的杀手：
     *
     *  IMPORTANT:
     *      The loaders here are resolved relative to the resource which they are applied to.
     *      This means they are not resolved relative the the configuration file.
     *      If you have loaders installed from npm and your node_modules folder is not in a parent folder of all source files,
     *      webpack cannot find the loader.
     *      You need to add the node_modules folder as absolute path to the resolveLoader.root option.
     *      (resolveLoader: { root: path.join(__dirname, "node_modules") })
     *
     * 关于root的配置，请继续往下看
     *
     *
     */
    , module: {
        loaders: [

            // css文件loader
            {
                test: /\.css$/
                , loader: 'style-loader!css-loader?minimize'
            }

            // 常规的图片文件加载，会在static目录下，生成一个相应目录的图片文件句柄。
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
     * 这！里！一！定！要！看！
     *
     * 我们日常开发如果是敏捷开发，都是从svn拉分支在co到某个目录，
     * 但如果使用webpack，那么部分loader是不能安装到全局的，
     * 但是我们又不想每次拉完分支都要去安装一遍loader。
     *
     * 所以，这里重配置了resolveLoader的 root，
     * 会查找webpack工程的上一层目录，
     * 这样我们只要保持一个loader的node_modules即可实现复用。
     *
     * 这也是没有办法的事，这点牺牲还是值得的，加油吧，骚年。
     *
     * loader被统一存放在 上一层目录的 node_modules 文件夹下
     */
    , resolveLoader: {
        root: path.resolve(__dirname, '../node_modules/')
    }
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
    ? compiler.watch({}, compilerCallBack)
    : compiler.run(compilerCallBack);

var colorsFunc = fis.cli.colors;

function compilerCallBack(err, stats) {

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