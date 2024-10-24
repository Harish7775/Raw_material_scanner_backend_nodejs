module.exports = {
  otpTemplate: `Your TruBond Login OTP is {otp} SRG Enterprises https://srgenterprises.in/`,
  rewardPointsTemplate: (totalRewardPoints) =>
    `Hi, You have now accumulated a total of ${totalRewardPoints} TruBond reward points SRG Enterprises https://srgenterprises.in/`,
  redeemAmountTemplate: (masonName, totalRedeemedAmount) =>
    `Hi ${masonName}, Your TruBond coupon has been redeemed successfully! The total amount you have redeemed so far is ${totalRedeemedAmount} SRG Enterprises https://srgenterprises.in/`,
};
