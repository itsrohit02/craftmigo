import WorkerProfile from "../models/workerProfile.model.js";

export const setUserBlocked = async (
  user,
  isBlocked,
  updateWorkerProfile = (userId, blocked) =>
    WorkerProfile.updateOne({ user: userId }, { $set: { isBlocked: blocked } })
) => {
  if (isBlocked) {
    user.isBlocked = true;
    await user.save();
    if (user.role === "worker") await updateWorkerProfile(user._id, true);
    return;
  }

  if (user.role === "worker") await updateWorkerProfile(user._id, false);
  user.isBlocked = false;
  await user.save();
};

export const isWorkerBookable = (profile, user) =>
  Boolean(
    profile &&
      profile.isBlocked === false &&
      profile.isSetupComplete &&
      profile.verificationStatus === "verified" &&
      profile.isAvailable &&
      user &&
      user.role === "worker" &&
      user.isBlocked !== true &&
      user.isActive !== false
  );
