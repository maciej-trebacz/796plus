Date.prototype.formattedTime = function() {
    var hours = (this.getHours() < 10) ? "0" + this.getHours() : this.getHours();
    var minutes = (this.getMinutes() < 10) ? "0" + this.getMinutes() : this.getMinutes();
    var seconds = (this.getSeconds() < 10) ? "0" + this.getSeconds() : this.getSeconds();
    return hours + ":" + minutes + ":" + seconds;
}