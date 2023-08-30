const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://0.0.0.0:27017/todolistDB")
.then( () => console.log("Connection successful....."))
.catch( (err) => console.log(err));

const itemsSchema = {
    name: String
}

const Item = mongoose.model("Item", itemsSchema)

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item"
});

const item3 = new Item({
    name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.set('view engine', 'ejs');

app.get("/", function(req, res){
    const getDocument = async() =>{
        const foundItems = await Item.find({});
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems)
        res.redirect("/");
        } else {
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
    }
    getDocument();
});

app.post("/", function(req, res){
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        const find_Document = async() => {
            const foundList = await List.findOne({name: listName});
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName);
        }
        find_Document();
    }
});

app.post("/delete", function(req, res){
    const id = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        const deleteDocument = async()=> {
            try{
                const result = await Item.findByIdAndDelete(id);
                console.log(result);
            } catch(err) {
                console.log(err);
            }
        }
        deleteDocument();
        res.redirect("/");
    } else {
        const updateDocument = async() => {
            const result = await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: id}}})
            res.redirect("/"+listName);
        }
        updateDocument();
    }
})

app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);

    const findDocument = async() => {
        const foundList = await List.findOne({name: customListName});
        if (!foundList) {
            const list = new List({
                name: customListName,
                items: defaultItems
            });
            list.save();
            res.redirect("/"+customListName);
        } else {
            res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        }
    }
    findDocument();
});

app.get("/about", function(req, res){
    res.render("about");
});

app.listen(3000, function(){
    console.log("Server started on port 3000");
});