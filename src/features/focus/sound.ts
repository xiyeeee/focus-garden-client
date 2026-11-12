let audioContext: AudioContext | null = null;
export const prepareSound = async () => {
  audioContext ??= new AudioContext();
  await audioContext.resume();
  if (audioContext.state !== "running")
    throw new Error("浏览器阻止了提示音，请点击“测试提示音”后重试。");
};
export const playSound = async () => {
  if (!audioContext || audioContext.state !== "running")
    throw new Error(
      "提示音未播放：浏览器需要先通过点击启用声音，可在设置中测试提示音。",
    );
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.frequency.value = 660;
  gain.gain.setValueAtTime(0.08, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 1);
};
