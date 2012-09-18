var LocalDatabase = {
    database: null,
    databaseName: null,
    databaseVersion: null,
    databaseMSize: null,
    data: null,
    schema: null,
    runningTransaction: false,
    preInstallingCallback: function () { },
    installingCallback: function () { },
    search: function (filter, table, maxItems, columns, isDistinct, sucessCallback) {
        var _SELF = this;
        sql = '';
        //build select sql
        if (columns != null && columns != '') {
            if (isDistinct == true && columns != null && columns != '' && columns.indexOf(',') == -1) {
                //must have one column to do distinct query
                sql += 'SELECT DISTINCT ' + columns + ' from ' + table;
            } else {
                sql += 'SELECT ' + columns + ' from ' + table;
            }
        } else {
            sql += 'SELECT * from ' + table;
        }
        //add where filters
        if (filter != '' && filter != null) {
            sql += ' WHERE ' + filter;
        }
        //add max items limit
        if (maxItems != '' && maxItems != null) {
            sql += ' LIMIT ' + maxItems;
        }
        //execute query & handle results
        if (sucessCallback != null) {
            _SELF.executeSQL([sql], [], sucessCallback, _SELF.handleSQLError);
        } else {
            _SELF.executeSQL([sql], [], _SELF.dataHandler, _SELF.handleSQLError);
        }
    },
    dataHandler: function (transaction, results) {
        var resultObj = [];
        for (var i = 0; i < results.rows.length; i++) {
            resultObj.push(results.rows.item(i));
        }
        return resultObj;
    },
    nullDataHandler: function () {
        console.log("SQL Query Succeeded");
    },
    handleSQLError: function (transaction, error) {
        if (error.code == 1) {
            // DB Table already exists
        } else {
            // Error is a human-readable string.
            console.log('Oops.  Error was ' + error.message + ' (Code ' + error.code + ')');
        }
        return false;
    },
    executeSQL: function (sql, args, sucess, err) {
        var _SELF = this;
        _SELF.runningTransaction = true;
        _SELF.database.transaction(
            function (transaction) {
                for (var i = 0; i < sql.length; i++) {
                    transaction.executeSql(sql[i], args[i], sucess, err);
                }
                _SELF.runningTransaction = false;
            }
        );
    },
    //drops a database table
    dropTable: function (name) {
        var _SELF = this;
        sql = 'DROP TABLE ' + name + ';'
        _SELF.executeSQL([sql], [], _SELF.nullDataHandler, _SELF.handleSQLError);
    },
    //loads data into a table in the databse
    loadData: function (tablename, data, rows, sucessCallback) {
        var _SELF = this;
        var values = '';
        var sql = 'INSERT INTO ' + tablename + '(';
        for (var i = 0; i < rows.length; i++) {
            sql += rows[i].name;
            sql += (i < rows.length - 1 ? ', ' : '');
            values += '?';
            values += (i < rows.length - 1 ? ', ' : '');
        }
        sql += ') VALUES (' + values + ')';
        var sqls = [];
        var args = [];
        for (var x = 0; x < data.length; x++) {
            var temp = [];
            for (var y = 0; y < rows.length; y++) {
                temp.push(data[x][rows[y].name]);
            }
            args.push(temp);
            sqls.push(sql);
        }
        if (sucessCallback != null) {
            _SELF.executeSQL(sqls, args, sucessCallback, _SELF.handleSQLError);
        } else {
            _SELF.executeSQL(sqls, args, _SELF.nullDataHandler, _SELF.handleSQLError);
        }
    },
    //creates a table in the database if it does not exist
    createTable: function (name, schema) {
        var _SELF = this;
        //create table from schema
        var sql = 'CREATE TABLE IF NOT EXISTS ' + name + '(';
        for (var i = 0; i < schema.length; i++) {
            sql += schema[i].name + ' ' + schema[i].type
            sql += (i < schema.length - 1 ? ',' : '');
        }
        sql += ');';
        _SELF.executeSQL([sql], [], _SELF.nullDataHandler, _SELF.handleSQLError);
    },
    //will create a database or open the databse if it is already in existance
    initDB: function (name, version, maxSize) {
        var _SELF = this;
        try {
            if (!window.openDatabase) {
                console.log('Local Databases are not supported by this browser.');
                return false;
            } else {
                _SELF.database = openDatabase(name, "", name, maxSize);
                var currentVersion = _SELF.database.version;
                if (currentVersion == version) {
                    //no new data
                    _SELF.installingCallback();
                } else {
                    //update is being pushed
                    _SELF.database.changeVersion(currentVersion, version, function () {                        
                        for (var i = 0; i < _SELF.data.length; i++) {
                            _SELF.dropTable(_SELF.data[i].name);
                            _SELF.createTable(_SELF.data[i].name, _SELF.data[i].columns);
                            _SELF.loadData(_SELF.data[i].name, _SELF.data[i].records, _SELF.data[i].columns, _SELF.installingCallback());
                        }
                    }, _SELF.handleSQLError, _SELF.nullDataHandler());                    
                }
                console.log('Database is up to date.');
            }
        } catch (e) {
            if (e == 2) {
                console.log("Database verison mismatch.");
            } else {
                console.log("Unknown error " + e + ".");
                return false;
            }
            return;
        }
    },
    init: function (extendObject) {
        var _SELF = this;
        if (extendObject != null) {
            $.extend(this, extendObject);
        }
        $().ready(function () {
            _SELF.preInstallingCallback();
            _SELF.initDB(_SELF.databaseName, _SELF.databaseVersion, _SELF.databaseMSize);
        });
        return this;
    }
};
