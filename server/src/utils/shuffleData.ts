// Fisher–Yates shuffle (a.k.a. Knuth shuffle)

export default (array: any[]) => {
  let currentIndex = array.length;

  while (currentIndex > 0) {
    // Pick a random index
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // Swap current element with the random element
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
};
