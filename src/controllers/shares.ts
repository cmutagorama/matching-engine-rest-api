import { NextFunction, Request, Response } from "express";
import { MoreThan } from "typeorm";
import { AppDataSource } from "../data-source";
import { Share } from "../entities/Share";
import { response } from "../utils/response";

const shareRepository = AppDataSource.getRepository(Share);

const getShares = async (type, order) => {
  return shareRepository.find({
    where: { type, qty: MoreThan(0) },
    select: ["qty", "prc"],
    order: { prc: order },
  });
};

const sell = async (req: Request, res: Response, next: NextFunction) => {
  const { qty, prc } = req.body;

  const buys = await shareRepository.find({
    where: { type: "buy", qty: MoreThan(0) },
    order: { prc: "ASC" },
  });

  if (buys.length === 0) {
    const newShare = shareRepository.create({ qty, prc, type: "sell" });
    const savedShare = await shareRepository.save(newShare);
    return response({ res, code: 201, data: { share: savedShare } });
  }

  const price = Number(prc);

  if (!!buys.find((b) => b.prc >= price)) {
    const highestShare = buys[buys.length - 1];

    if (highestShare.qty < qty) {
      const remainder = qty - highestShare.qty;
      highestShare.qty = 0;
      await shareRepository.save(highestShare);

      const share = buys.find((b) => b.prc === price);
      if (share && share.qty >= remainder) {
        share.qty -= remainder;
        const savedShare = await shareRepository.save(share);
        return response({ res, code: 200, data: { share: savedShare } });
      } else {
        const newShare = shareRepository.create({
          qty: remainder,
          prc: price,
          type: "sell",
        });
        const savedShare = await shareRepository.save(newShare);
        return response({ res, code: 201, data: { share: savedShare } });
      }
    } else {
      highestShare.qty -= qty;
      const savedShare = await shareRepository.save(highestShare);
      return response({ res, code: 200, data: { share: savedShare } });
    }
  } else {
    const sellShare = await shareRepository.findOne({
      where: { type: "sell", prc: price },
    });

    if (sellShare) {
      sellShare.qty = sellShare.qty + parseInt(qty);
      await shareRepository.save(sellShare);
      return response({ res, code: 200, data: { share: sellShare } });
    }

    const newShare = shareRepository.create({ qty, prc, type: "sell" });
    const savedShare = await shareRepository.save(newShare);
    return response({ res, code: 201, data: { share: savedShare } });
  }
};

const buy = async (req: Request, res: Response, next: NextFunction) => {
  const { qty, prc } = req.body;
  
	const sells = await shareRepository.find({
    where: { type: "sell", qty: MoreThan(0) },
    order: { prc: "ASC" },
  });

  if (sells.length === 0) {
    const newShare = shareRepository.create({ qty, prc, type: "buy" });
    const savedShare = await shareRepository.save(newShare);
    return response({ res, code: 201, data: { share: savedShare } });
  }

  const price = Number(prc);

  if (!!sells.find((b) => b.prc <= price)) {
    const lowestShare = sells[0];

    if (lowestShare.qty < qty) {
      const remainder = qty - lowestShare.qty;
      lowestShare.qty = 0;
      await shareRepository.save(lowestShare);

      const share = sells.find((b) => b.prc === price);
      if (share && share.qty >= remainder) {
        share.qty -= remainder;
        const savedShare = await shareRepository.save(share);
        return response({ res, code: 200, data: { share: savedShare } });
      } else {
        const newShare = shareRepository.create({
          qty: remainder,
          prc: price,
          type: "buy",
        });
        const savedShare = await shareRepository.save(newShare);
        return response({ res, code: 201, data: { share: savedShare } });
      }
    } else {
      lowestShare.qty -= qty;
      const savedShare = await shareRepository.save(lowestShare);
      return response({ res, code: 200, data: { share: savedShare } });
    }
  } else {
    const buyShare = await shareRepository.findOne({
      where: { type: "buy", prc: price },
    });

    if (buyShare) {
      buyShare.qty = buyShare.qty + parseInt(qty);
      await shareRepository.save(buyShare);
      return response({ res, code: 200, data: { share: buyShare } });
    }

    const newShare = shareRepository.create({ qty, prc, type: "buy" });
    const savedShare = await shareRepository.save(newShare);
    return response({ res, code: 201, data: { share: savedShare } });
  }
};

const book = async (req: Request, res: Response, next: NextFunction) => {
  const buys = await getShares("buy", "DESC");
  const sells = await getShares("sell", "ASC");
  const data = { buys, sells };

  return response({ res, code: 200, data });
};

export default { sell, buy, book };