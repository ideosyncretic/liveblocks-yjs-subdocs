export const colors = [
  "#958DF1",
  "#F98181",
  "#FBBC88",
  "#FAF594",
  "#70CFF8",
  "#94FADB",
  "#B9F18D",
];

const getRandomElement = (list: string[]) =>
  list[Math.floor(Math.random() * list.length)];

export const getRandomColor = () => getRandomElement(colors);
