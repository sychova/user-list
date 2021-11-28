const mssql = require("mssql/msnodesqlv8");
const dbConfig = require("./dbconfig");
const { sorterBy, sorterDirection } = require("./userServiceSQLHelper");

const pool = new mssql.ConnectionPool(dbConfig.config);

const paginateUsers = (req, res) => {
    pool.connect(() => {
        var sql = "SELECT * FROM dbo.users";
        pool.query(sql, (err, result) => {
            var page = req;
            var limit = 5;
            var startIndex = (page - 1) * limit;
            var endIndex = page * limit;
            var resultUsers = result.recordset.slice(startIndex, endIndex);
            res.send(resultUsers);
        });
        mssql.close();
    });
};

const getUsers = (order) => {
    return new Promise ((resolve, reject) => {
        var sortBy = sorterBy(order.sorting);
        var sortDirection = sorterDirection(order.order);
        pool.connect().then(() => {
            if (order.filter) {
                var sql = `
                SELECT *
                FROM dbo.users
                WHERE first_name LIKE @Search OR last_name LIKE @Search OR age LIKE @Search OR phone LIKE @Search OR email LIKE @Search OR gender LIKE @Search
                ORDER BY ${sortBy} ${sortDirection}
                OFFSET @Offset ROWS
                FETCH FIRST @Size ROWS ONLY
                `;
            } else {
                var sql = `
                SELECT *
                FROM dbo.users
                ORDER BY ${sortBy} ${sortDirection}
                OFFSET @Offset ROWS
                FETCH FIRST @Size ROWS ONLY
                `;
            }
            pool.request()
                .input("Search", mssql.VarChar, `%${order.filter}%`)
                .input("Offset", mssql.Int, `${(parseInt(order.page) - 1) * parseInt(order.size)}`)
                .input("Size", mssql.Int, `${parseInt(order.size)}`)
                .query(sql, (err, result) => {
                    resolve(result.recordset);
                });
            mssql.close();
        });
    })
};

const createUser = (user) => {
    return new Promise((resolve, reject) => {
        var sql = `
        INSERT INTO dbo.users (first_name, last_name, age, phone, email, gender)
        VALUES (@first_name, @last_name, @age, @phone, @email, @gender)
        `;
        pool.connect().then(() => {
            pool.request()
                .input("first_name", mssql.VarChar, `${user.FirstName}`)
                .input("last_name", mssql.VarChar, `${user.LastName}`)
                .input("age", mssql.VarChar, `${user.Age}`)
                .input("phone", mssql.VarChar, `${user.Phone}`)
                .input("email", mssql.VarChar, `${user.Email}`)
                .input("gender", mssql.VarChar, `${user.Gender}`)
                .query(sql);
            mssql.close();
        });
        resolve()
    })
};

const deleteUser = (req, res) => {
    pool.connect().then(() => {
        var sql = `
        DELETE FROM dbo.users
        WHERE user_id = @user_id
        `;
        pool.request()
            .input("user_id", mssql.Int, `${parseInt(req)}`)
            .query(sql);
        mssql.close();
    });
};

function editUser (id) {
    return new Promise((resolve, reject) => {
        pool.connect().then(() => {
            var sql = `SELECT *
            FROM dbo.users
            WHERE user_id = @user_id
            `;
            pool.request()
                .input("user_id", mssql.Int, `${parseInt(id)}`)
                .query(sql, (err, result) => {
                    resolve(result.recordset[0]);
                });
            mssql.close();
        });
    })
};

function updateUser (user) {
    return new Promise((resolve, reject) => {
        pool.connect().then(() => {
            var sql = `
            UPDATE dbo.users SET
            first_name = @first_name,
            last_name = @last_name,
            age = @age,
            phone = @phone,
            email = @email,
            gender = @gender
            WHERE user_id = @user_id
            `;
            pool.request()
                .input("user_id", mssql.Int, `${user.Id}`)
                .input("first_name", mssql.VarChar, `${user.FirstName}`)
                .input("last_name", mssql.VarChar, `${user.LastName}`)
                .input("age", mssql.VarChar, `${user.Age}`)
                .input("phone", mssql.VarChar, `${user.Phone}`)
                .input("email", mssql.VarChar, `${user.Email}`)
                .input("gender", mssql.VarChar, `${user.Gender}`)
                .query(sql);
            mssql.close();
        });
        resolve()
    })
};

module.exports = {
    getUsers,
    deleteUser,
    editUser,
    updateUser,
    createUser,
    paginateUsers
}
