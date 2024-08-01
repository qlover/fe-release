export default class Thread {
  static sleep(ms = 16) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
