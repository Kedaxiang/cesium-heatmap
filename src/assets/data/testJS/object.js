let book = {
    year_: 2017,
    edition: 1   
}
Object.defineProperty(book, "year", {
    get() {
        return this.year_;
    },
    set(newValue) {
        if(newValue > 2017) {
            this.year_ = newValue;
            this.edition += newValue - 2017;
        }
    }
})
book.year_ = 2018
console.log(book.edition)