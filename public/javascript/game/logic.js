jQuery(document).ready(function($) {
    //Main game instance
    var main = new EK();
    
    //Connect to socket
    io = io.connect();
    
    //******** Click Events ********//
    
    $("#loginButton").click(function() {
        var nickname = $('#nameInput').val();
        if (nickname.length < 1) {
           Login.showError('Name is too short!');
        } else {
            io.emit($C.LOBBY.CONNECT, { nickname: nickname });
        }
    });
    
    $("#newGameButton").click(function() {
        var name = prompt("Type in a title:", "bob");
        io.emit($C.GAME.CREATE, { title: name });
    });
    
    //******** IO Events ********//
    
    io.on($C.LOBBY.CONNECT, function(data) {
        if (data.hasOwnProperty('success')) {
            
            var connectedUsers = data.connectedUsers;
            var gameList = data.gameList;
            
            //Add the connected users to the user list
            $.each(connectedUsers, function(key, user) {
                main.addUser(new User(user.id, user.name));
            });
            
            //Add the games to the list
            $.each(gameList, function(key, game) {
                main.addGame(gameFromData(game));
            });
            
            //Set the current user
            var user = main.users[data.user.id];
            main.currentUser = user;
            
            //Update displays
            Lobby.updateUserList(main);
            Lobby.updateGameList(main);
            
            //Hide login
            Login.hide(); 
        }
        
        if (data.hasOwnProperty('error')) {
            Login.showError(data.error);
        }
    });
    
    io.on($C.USER.CONNECT, function(data) {
        main.addUser(new User(data.id, data.name));
        Lobby.updateUserList(main);
    });
    
    io.on($C.USER.DISCONNECT, function(data) {
        main.removeUser(data.id);
        Lobby.updateUserList(main);
    });
    
    io.on($C.GAME.CREATE, function(data) {
        if (!data.hasOwnProperty('error')) {
            //Hide lobby
            Lobby.hide();
            
            //Set the current game
            main.currentUser.currentGame = data.game.id;
            
            //Update
            GameRoom.updatePlayerList(main);
        }
    });
    
    io.on($C.GAME.CREATED, function(data) {
        console.log(data);
        main.addGame(gameFromData(data));
        Lobby.updateGameList(main);
    });
          
    io.on($C.GAME.REMOVED, function(data) {
        main.removeGame(data.id);
        
        //Replace the current game room for user
        if (main.currentUser && main.currentUser.currentGame == data.id) {
            main.currentUser.currentGame = null;
        }
        
        Lobby.updateGameList(main);
    });
    
    io.on($C.GAME.JOIN, function(data) {
        console.log(data);
        if (data.hasOwnProperty('success')) {
            //Hide lobby
            Lobby.hide();
            
            //Update data we have
            main.addGame(gameFromData(data.game));
            
            //Set the current game
            main.currentUser.currentGame = data.game.id;
            
            //Update
            GameRoom.updatePlayerList(main);
        }
    });
    
    io.on($C.GAME.PLAYER.CONNECT, function(data) {
        //Update game data
        main.addGame(gameFromData(data.game));
        GameRoom.updatePlayerList(main);
    });
    
    io.on($C.GAME.PLAYER.DISCONNECT, function(data) {
        console.log(data);
        //Update game data
        main.addGame(gameFromData(data.game));
        GameRoom.updatePlayerList(main);
    });
    
    /**
     * Create a game from data
     * @param   {Object}   data The data
     * @returns {Object} A game object
     */
    var gameFromData = function(data) {

        var players = [];
        
        //Add players
        $.each(data.players, function(index, player) {
            var user = main.users[player.user.id];
            if (user) {
                players.push(new Player(user, player.alive, player.ready));
            }
        });
        
        return new Game(data.id, data.title, data.status, players);
    }

});
